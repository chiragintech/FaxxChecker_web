import json
from typing import Annotated, List, Sequence, TypedDict
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    FunctionMessage,
    HumanMessage,
)
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, StateGraph
from langgraph.prebuilt.tool_executor import ToolExecutor, ToolInvocation
import operator
import functools
import os
import json
from typing import Annotated, List, Sequence, TypedDict
from langchain_core.messages import AIMessage, BaseMessage, FunctionMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, StateGraph
from langgraph.prebuilt.tool_executor import ToolExecutor, ToolInvocation
import operator
import functools
import os
import glob

# Import RAG-related dependencies
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_community.embeddings import HuggingFaceEmbeddings

# Previous tool imports
from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_experimental.utilities import PythonREPL
# Set up Tavily
os.environ['TAVILY_API_KEY'] = "TAVILY_API_KEY"
from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
tavily_tool = TavilySearchResults(max_results=20)

# Set up Python REPL
from langchain_experimental.utilities import PythonREPL
repl = PythonREPL()
# producer.py
from kafka import KafkaProducer
import json
from googlesearch import search
import requests
from bs4 import BeautifulSoup
import time

class WebCrawlerProducer:
    def __init__(self, bootstrap_servers=['localhost:9092']):
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda x: json.dumps(x).encode('utf-8')
        )
        
    def crawl_website(self, url):
        try:
            response = requests.get(url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = soup.title.string if soup.title else "No title"
            description = soup.find('meta', {'name': 'description'})
            description = description.get('content') if description else "No description"
            
            text_content = ' '.join([p.text for p in soup.find_all('p')])[:500]
            
            return {
                'url': url,
                'title': title,
                'description': description,
                'content_preview': text_content,
                'timestamp': time.time()
            }
        except Exception as e:
            print(f"Error crawling {url}: {str(e)}")
            return None

    def search_and_produce(self, search_query, topic_name='web_crawler'):
        print(f"Starting search for: {search_query}")
        search_results = list(search(search_query, num_results=10))
        
        for url in search_results:
            data = self.crawl_website(url)
            if data:
                self.producer.send(topic_name, value=data)
                print(f"Produced data for: {url}")
        
        self.producer.flush()
        print("Finished producing messages")

producer = WebCrawlerProducer()
search_query = input("Enter search query: ")
producer.search_and_produce(search_query)
@tool
def python_repl(code: Annotated[str, "The python code to execute to generate your chart."]):
    """Use this to execute python code. If you want to see the output of a value, 
    you should print it out with `print(...)`. This is visible to the user."""
    try:
        result = repl.run(code)
    except BaseException as e:
        return f"Failed to execute. Error: {repr(e)}"
    return f"Successfully executed:\n{code}\nStdout: {result}"

tools = [tavily_tool, python_repl]
tool_executor = ToolExecutor(tools)

# Define the state that is passed between nodes
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    sender: str

def initialize_rag_system():
    file_paths = glob.glob("./kafka/crawler_results/*.txt")
    file_paths2 = glob.glob("./kafka/crawler_results/*.json")
    if not file_paths:
        raise RuntimeError("No files found in the specified directory.")
    
    docs = []
    for file_path in file_paths + file_paths2:
        loader = TextLoader(file_path)
        docs.extend(loader.load())
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    split_docs = text_splitter.split_documents(docs)
    
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    
    vectorstore = FAISS.from_documents(split_docs, embeddings)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    
    llm = Ollama(model="llama3")
    
    prompt = ChatPromptTemplate.from_template(
        """Answer the question using ONLY the context below. Keep responses detailed.
        Give the top 5 most reliable urls of the correct resource for the particular question.
        <context>
        {context}
        </context>
        Question: {input}"""
    )
    
    document_chain = create_stuff_documents_chain(llm, prompt)
    return create_retrieval_chain(retriever, document_chain)

# Initialize RAG chain
rag_chain = initialize_rag_system()

tools = [python_repl]
tool_executor = ToolExecutor(tools)

# Define state
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    sender: str

def create_agent(llm, tools, system_message: str):
    """Create an agent with specific formatting instructions."""
    tool_names = [t.name for t in tools]
    
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a helpful AI assistant, collaborating with other assistants. 
            Answer the question using ONLY the context below. Keep responses detailed and well-formatted.

            <context>
            {context}
            </context>
            
            Question: {input}

            **Verdict**: [FAKE or REAL]

            
            **Detailed Analysis**:
            [Provide a detailed explanation of why the information is fake or real]


            **News Outlet Reliability**:
            [Evaluate the reliability of the news sources, with specific details about their reputation and track record]


            **Top 5 Relevant Sources**:
            1. [URL 1]
            2. [URL 2]
            3. [URL 3]
            4. [URL 4]
            5. [URL 5]

            Remember to maintain proper spacing and formatting in your response."""
        
            "Format your responses as follows:\n"
            "1. To use a tool, write: TOOL: tool_name(input)\n"
            "2. When you have a final answer, start with: FINAL ANSWER:\n"
            "3. Keep responses clear and concise\n"""
            f"Available tools: {', '.join(tool_names)}.\n{system_message}"
        ),
        MessagesPlaceholder(variable_name="messages"),
    ])
    
    return prompt | llm
def format_output(state_dict):
    """Format the output in a clean, readable way."""
    if 'RAG' in state_dict:
        message = state_dict['RAG']['messages'][0].content
        return f"RAG Agent: {message}"
    elif 'Chart Generator' in state_dict:
        message = state_dict['Chart Generator']['messages'][0].content
        return f"Chart Generator: {message}"
    elif 'Researcher' in state_dict:
        message = state_dict['Researcher']['messages'][0].content
        return f"Researcher: {message}"
    elif 'call_tool' in state_dict and state_dict['call_tool']['messages']:
        message = state_dict['call_tool']['messages'][0].content
        return f"Tool Response: {message}"
    return str(state_dict)

def rag_node(state):
    """Process RAG queries."""
    messages = state["messages"]
    last_message = messages[-1]
    
    try:
        response = rag_chain.invoke({"input": last_message.content})
        return {
            "messages": [HumanMessage(content=f"FINAL ANSWER: {response['answer']}", name="RAG")],
            "sender": "RAG"
        }
    except Exception as e:
        return {
            "messages": [HumanMessage(content=f"Error in RAG processing: {str(e)}", name="RAG")],
            "sender": "RAG"
        }
def tool_node(state):
    """Runs tools in the graph with proper parsing."""
    messages = state["messages"]
    last_message = messages[-1]
    
    if isinstance(last_message.content, str):
        content = last_message.content
        if "TOOL: python_repl(" in content or "TOOL: tavily_search(" in content:
            # Extract tool name and input
            start_idx = content.find("TOOL: ") + 6
            end_idx = content.find("(")
            tool_name = content[start_idx:end_idx].strip()
            
            # Extract the input between parentheses
            input_start = content.find("(") + 1
            input_end = content.rfind(")")
            tool_input = content[input_start:input_end].strip()
            
            # Remove any markdown code blocks
            tool_input = tool_input.replace("```python", "").replace("```", "").strip()
            
            action = ToolInvocation(
                tool=tool_name,
                tool_input=tool_input
            )
            
            try:
                response = tool_executor.invoke(action)
                return {"messages": [FunctionMessage(content=f"{tool_name} output: {response}", name=tool_name)]}
            except Exception as e:
                return {"messages": [FunctionMessage(content=f"Error executing {tool_name}: {str(e)}", name=tool_name)]}
    
    return {"messages": []}


def router(state):
    """Route between agents and tools with RAG integration."""
    messages = state["messages"]
    last_message = messages[-1]
    
    # Check recursion limit
    if len(messages) > state.get("recursion_limit", 10):
        return "end"
    
    # Check if this is a document-related query
    if any(keyword in last_message.content.lower() 
           for keyword in ["document", "documents", "text", "content", "file"]):
        return "RAG"
    
    if isinstance(last_message.content, str):
        if "TOOL:" in last_message.content:
            return "call_tool"
        if "FINAL ANSWER" in last_message.content:
            return "end"
    
    return "continue"

# Initialize Ollama
llm = Ollama(model="llama3") 

# Create the agents
tavily_agent = create_agent(
    llm,
    [tavily_tool],
    system_message="You are a Tavily search assistant. You can search for information by using 'TOOL: tavily_search(your query)'"
)

chart_agent = create_agent(
    llm,
    [python_repl],
    system_message="You can execute Python code by using 'TOOL: python_repl(your code)'. Any charts you display will be visible by the user."
)

# Create agent nodes
def agent_node(state, agent, name):
    """Process agent responses with proper formatting."""
    result = agent.invoke(state)
    if isinstance(result, BaseMessage):
        message = result
    else:
        message = HumanMessage(content=result, name=name)
    return {
        "messages": [message],
        "sender": name,
    }


research_node = functools.partial(agent_node, agent=tavily_agent, name="Researcher")
chart_node = functools.partial(agent_node, agent=chart_agent, name="Chart Generator")

# Create the workflow
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("Researcher", research_node)
workflow.add_node("Chart Generator", chart_node)
workflow.add_node("RAG", rag_node)
workflow.add_node("call_tool", tool_node)
workflow.add_conditional_edges(
    "Researcher",
    router,
    {
        "continue": "Chart Generator",
        "call_tool": "call_tool",
        "RAG": "RAG",  # Changed from "rag" to "RAG" to match router output
        "end": END
    }
)

workflow.add_conditional_edges(
    "Chart Generator",
    router,
    {
        "continue": "Researcher",
        "call_tool": "call_tool",
        "RAG": "RAG",  # Changed from "rag" to "RAG" to match router output
        "end": END
    }
)

workflow.add_conditional_edges(
    "RAG",
    router,
    {
        "continue": "Researcher",
        "call_tool": "call_tool",
        "RAG": "RAG",
        "end": END
    }
)

workflow.add_conditional_edges(
    "call_tool",
    lambda x: x["sender"],
    {
        "Researcher": "Researcher",
        "Chart Generator": "Chart Generator",
        "RAG": "RAG"  # Added RAG to tool response routing
    }
)


workflow.set_entry_point("Researcher")
graph = workflow.compile()

# Example usage
initial_state = {
    "messages": [
        HumanMessage(content=search_query)
    ],
    "sender": "Human",
    "recursion_limit": 3,
    "input": search_query,
    "context": ""
}

# Execute workflow
for s in graph.stream(initial_state):
    formatted_output = format_output(s)
    print(formatted_output)
    print("----")


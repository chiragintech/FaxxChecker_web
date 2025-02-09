"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    fact_checks: 0,
    accuracy: "0%"
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('http://localhost:5001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProfile({
            full_name: data.full_name || "",
            email: data.email || "",
            fact_checks: data.fact_checks || 0,
            accuracy: data.accuracy || "0%"
          });
        } else {
          if (response.status === 401) {
            localStorage.removeItem('token');
            router.push('/login');
          }
          throw new Error('Failed to fetch profile');
        }
      } catch (err) {
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('storage'));
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader className="animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="p-6">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => router.push('/login')} className="mt-4">
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl p-6">
        <div className="flex items-center space-x-4 mb-6">
          <User className="h-12 w-12" />
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            <p className="text-gray-500">{profile.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={profile.full_name}
              disabled
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={profile.email}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

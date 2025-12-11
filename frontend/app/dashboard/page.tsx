"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JobCard from "@/components/JobCard";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const { user, loading } = useAuth();
    const [stats, setStats] = useState({ jobs: 0, running: 0, agents: 0 });
    const [recentJobs, setRecentJobs] = useState([]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            // Mock stats or fetch from new endpoints
            // For now, derive from jobs list
            const jobsRes = await api.get("/jobs/");
            const agentsRes = await api.get("/agents/");

            const jobs = jobsRes.data;
            const agents = agentsRes.data;

            setStats({
                jobs: jobs.length,
                running: jobs.filter((j: any) => j.status === 'running').length,
                agents: agents.length
            });
            setRecentJobs(jobs.slice(0, 5));
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!user) return <div>Access Denied</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div>
                    <span className="mr-4 font-bold text-green-600">Credits: {user.balance?.toFixed(2)}</span>
                    <Button onClick={() => window.location.href = '/jobs/submit'}>New Job</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.jobs}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Running</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{stats.running}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Active Agents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.agents}</div>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-xl font-bold mb-4">Recent Jobs</h2>
            <div>
                {recentJobs.map((job: any) => (
                    <JobCard key={job.id} job={job} />
                ))}
                {recentJobs.length === 0 && <p className="text-gray-500">No jobs found.</p>}
            </div>
        </div>
    );
}

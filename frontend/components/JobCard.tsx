import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import StatusDot from "./StatusDot";
import { Button } from "@/components/ui/button";

const JobCard = ({ job }: { job: any }) => {
    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">Job #{job.id}</CardTitle>
                    <StatusDot status={job.status} />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-500">Owner ID: {job.owner_id}</p>
                <p className="text-sm">Cmd: <code>{job.run_command}</code></p>
                <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
                    <span>CPU: {job.cpu_req}</span>
                    <span>RAM: {job.ram_req}GB</span>
                    <span>Cost: {job.cost.toFixed(4)}</span>
                </div>
                <div className="mt-2">
                    <a href={`/jobs/${job.id}`} className="text-blue-500 text-sm hover:underline">View Details</a>
                </div>
            </CardContent>
        </Card>
    );
};

export default JobCard;

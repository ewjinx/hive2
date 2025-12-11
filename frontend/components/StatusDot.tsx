import React from 'react';

const StatusDot = ({ status }: { status: string }) => {
    let color = "bg-gray-400";
    if (status === "running" || status === "busy") color = "bg-blue-500 animate-pulse";
    if (status === "success" || status === "idle") color = "bg-green-500";
    if (status === "failed") color = "bg-red-500";
    if (status === "offline") color = "bg-gray-500";
    if (status === "queued") color = "bg-yellow-500";

    return (
        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${color}`} />
    );
};

export default StatusDot;

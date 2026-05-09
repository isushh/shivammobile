"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Order {
    id: string;
    customerName: string;
    deviceModel: string;
    issue: string;
    status: "processing" | "ready";
    createdAt: string;
}

interface PendingOrdersProps {
    orders?: Order[];
}

// Mock orders data
const mockOrders: Order[] = [
    {
        id: "1",
        customerName: "Rajesh Kumar",
        deviceModel: "iPhone 13 Pro",
        issue: "Battery replacement",
        status: "processing",
        createdAt: "2024-01-15T10:30:00",
    },
    {
        id: "2",
        customerName: "Priya Sharma",
        deviceModel: "Samsung Galaxy S23",
        issue: "Screen repair",
        status: "ready",
        createdAt: "2024-01-15T09:15:00",
    },
    {
        id: "3",
        customerName: "Amit Patel",
        deviceModel: "OnePlus 11",
        issue: "Charging port fix",
        status: "processing",
        createdAt: "2024-01-14T16:45:00",
    },
];

export default function PendingOrders({ orders: propOrders }: PendingOrdersProps) {
    const [orders, setOrders] = useState<Order[]>(propOrders || mockOrders);

    const toggleStatus = (orderId: string) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? {
                        ...order,
                        status: order.status === "processing" ? "ready" : "processing",
                    }
                    : order
            )
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                Pending Orders - Sitamarhi
            </h2>

            <div className="space-y-4">
                {orders.map((order, index) => (
                    <motion.div
                        key={order.id}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-card-bg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-foreground">
                                        {order.customerName}
                                    </h3>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === "ready"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            }`}
                                    >
                                        {order.status === "ready" ? "Ready for Pickup" : "Processing"}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/70">
                                    <span className="font-medium">{order.deviceModel}</span> - {order.issue}
                                </p>
                                <p className="text-xs text-foreground/50 mt-1">
                                    {new Date(order.createdAt).toLocaleString("en-IN", {
                                        dateStyle: "medium",
                                        timeStyle: "short",
                                    })}
                                </p>
                            </div>

                            <motion.button
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${order.status === "processing"
                                        ? "bg-primary text-white hover:bg-primary/90"
                                        : "border border-primary text-primary hover:bg-primary/10"
                                    }`}
                                onClick={() => toggleStatus(order.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {order.status === "processing" ? "Mark Ready" : "Mark Processing"}
                            </motion.button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
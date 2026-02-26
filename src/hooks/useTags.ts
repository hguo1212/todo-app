"use client";
// src/hooks/useTags.ts
// 标签数据 Hook — 和 useTodos 同样的模式

import { useState, useEffect } from "react";
import { Tag } from "@prisma/client";

export type TagWithCount = Tag & { _count: { todos: number } };

export function useTags() {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/tags");
      const json = await res.json();
      if (json.success) setTags(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, []);

  const createTag = async (name: string, color: string) => {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const json = await res.json();
    if (json.success) {
      setTags((prev) => [...prev, { ...json.data, _count: { todos: 0 } }]);
    }
    return json;
  };

  return { tags, loading, createTag, refetch: fetchTags };
}

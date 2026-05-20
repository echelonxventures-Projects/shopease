"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, MapPin, Globe, Building2, Landmark, Home, Map } from "lucide-react";

const TYPE_ICONS: Record<string, typeof Globe> = {
  PLANET: Globe,
  REGION: Map,
  COUNTRY: Globe,
  STATE: Building2,
  DISTRICT: Landmark,
  VILLAGE: Home,
  CITY: Building2,
};

const TYPE_COLORS: Record<string, string> = {
  PLANET: "text-blue-600",
  REGION: "text-green-600",
  COUNTRY: "text-orange-600",
  STATE: "text-purple-600",
  DISTRICT: "text-pink-600",
  VILLAGE: "text-teal-600",
  CITY: "text-red-600",
};

interface LocationNode {
  id: string;
  name: string;
  code: string | null;
  type: string;
  parentId: string | null;
  isActive: boolean;
  children: LocationNode[];
}

interface LocationTreeProps {
  nodes: LocationNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function LocationTreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onEdit,
}: {
  node: LocationNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const Icon = TYPE_ICONS[node.type] || MapPin;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition ${
          isSelected
            ? "bg-blue-50 text-blue-700 font-semibold"
            : "hover:bg-gray-50 text-gray-700"
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => {
          onSelect(node.id);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Icon className={`w-4 h-4 ${TYPE_COLORS[node.type] || "text-gray-500"}`} />
        <span className="text-sm truncate">{node.name}</span>
        {node.code && (
          <span className="text-xs text-gray-400 ml-auto">{node.code}</span>
        )}
        {!node.isActive && (
          <span className="text-xs text-gray-400 ml-auto px-1.5 py-0.5 bg-gray-100 rounded">Inactive</span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <LocationTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LocationTree({ nodes, selectedId, onSelect, onEdit }: LocationTreeProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No locations configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <LocationTreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

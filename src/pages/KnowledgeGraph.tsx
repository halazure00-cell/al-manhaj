import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface GraphNode {
  id: string;
  name: string;
  category: string;
  val: number;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Hover state
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const res = await apiFetch('/api/notes/graph');
        if (!res.ok) throw new Error('Failed to fetch graph data');
        const data = await res.json();
        setGraphData(data);
      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat grafik');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());

    if (node) {
      const newHighlightNodes = new Set<string>();
      const newHighlightLinks = new Set<string>();

      newHighlightNodes.add(node.id);

      graphData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;

        if (sourceId === node.id) {
          newHighlightNodes.add(targetId);
          newHighlightLinks.add(`${sourceId}-${targetId}`);
        } else if (targetId === node.id) {
          newHighlightNodes.add(sourceId);
          newHighlightLinks.add(`${sourceId}-${targetId}`);
        }
      });

      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    }

    setHoverNode(node);
  }, [graphData]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    // Navigate to the notes page and perhaps pass the note ID to open it
    // Assuming /notes handles state or we just go to /notes for now
    // A more robust app might have /notes/:id
    navigate('/notes', { state: { selectedNoteId: node.id } });
  }, [navigate]);

  // A minimal Zinc color palette for categories
  const getCategoryColor = (category: string) => {
    const colors = [
      '#18181b', // zinc-900
      '#3f3f46', // zinc-700
      '#71717a', // zinc-500
      '#a1a1aa', // zinc-400
      '#d4d4d8', // zinc-300
    ];
    
    // Simple hash to consistently map category string to a color
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isHighlighted = highlightNodes.has(node.id);
    const isHovered = hoverNode?.id === node.id;
    
    // Base size based on connections (val)
    const size = Math.max(4, Math.min(12, 2 + Math.sqrt(node.val || 1) * 2));
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = isHighlighted ? '#000000' : getCategoryColor(node.category);
    ctx.fill();
    
    // Draw stroke if highlighted
    if (isHighlighted) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
      
      // Outer glow/ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    }

    // Draw text label if hovered or highlighted
    if (isHighlighted || globalScale > 1.5) {
      const label = node.name;
      const fontSize = isHovered ? 14 / globalScale : 12 / globalScale;
      ctx.font = `${isHovered ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Text background
      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y + size + 2,
        bckgDimensions[0],
        bckgDimensions[1]
      );

      ctx.fillStyle = '#18181b'; // zinc-900
      ctx.fillText(label, node.x, node.y + size + 2 + bckgDimensions[1] / 2);
    }
  }, [highlightNodes, hoverNode]);

  if (loading) {
    return (
      <div className="px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-0 max-w-7xl mx-auto flex flex-col h-full space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 shrink-0">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-zinc-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-zinc-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 bg-zinc-100 border border-zinc-200 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-0 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight">Knowledge Graph</h1>
          <p className="text-zinc-500 mt-2 text-sm">Visualisasi jaringan catatan dan keterkaitannya.</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden relative"
        ref={containerRef}
      >
        {graphData.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-sm">
            Belum ada catatan untuk divisualisasikan.
          </div>
        ) : (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel=""
            nodeRelSize={6}
            linkColor={(link: any) => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              return highlightLinks.has(`${sourceId}-${targetId}`) ? '#18181b' : '#e4e4e7';
            }}
            linkWidth={(link: any) => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              return highlightLinks.has(`${sourceId}-${targetId}`) ? 2 : 1;
            }}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={(link: any) => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              return highlightLinks.has(`${sourceId}-${targetId}`) ? 4 : 0;
            }}
            nodeCanvasObject={paintNode}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            d3VelocityDecay={0.3}
            cooldownTicks={100}
          />
        )}
      </motion.div>
    </div>
  );
}

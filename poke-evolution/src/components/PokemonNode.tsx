import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

// 타입 정의
interface PokemonNodeData {
    label: string;
    imageUrl: string;
}
interface PokemonNodeProps {
    data: PokemonNodeData;
    id: string;
    onClick: (id: string) => void;
}

function PokemonNode({ data, id, onClick }: PokemonNodeProps) {
    const nodeStyle = {
        background: 'var(--card-bg)', border: '1px solid #eee', borderRadius: '12px',
        padding: '15px 20px', width: '150px', textAlign: 'center' as const, fontSize: '18px',
        fontWeight: 'bold', boxShadow: 'var(--card-shadow)', cursor: 'pointer',
    };
    const imageStyle = { width: '96px', height: '96px' };

    return (
        <motion.div
            style={nodeStyle}
            onClick={() => onClick(id)}
            className="pokemon-node"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
        >
            <Handle type="target" position={Position.Left} />
            <img src={data.imageUrl} alt={data.label} style={imageStyle} />
            <div>{data.label}</div>
            <Handle type="source" position={Position.Right} />
        </motion.div>
    );
}

export default PokemonNode;
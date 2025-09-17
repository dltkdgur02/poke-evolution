import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { typeColors } from '../typeColors';

interface PokemonType {
    type: { name: string };
}
interface PokemonNodeData {
    label: string;
    imageUrl: string;
    types?: PokemonType[]; // types를 data로 받도록 추가
}

interface PokemonNodeProps {
    data: PokemonNodeData;
    id: string;
    onClick: (id: string) => void;
}

function PokemonNode({ data, id, onClick }: PokemonNodeProps) {
    // 포켓몬의 첫 번째 타입을 기준으로 색상을 결정합니다.
    const primaryType = data.types?.[0]?.type.name || 'normal';
    const color = typeColors[primaryType] || '#A8A77A';
    const nodeStyle = {
        background: 'var(--card-bg)',
        border: `3px solid ${color}`, // 테두리에 타입 색상 적용
        borderRadius: '12px',
        padding: '15px 20px',
        width: '150px',
        textAlign: 'center' as const,
        fontSize: '18px',
        fontWeight: 'bold',
        boxShadow: `0 4px 12px ${color}40`, // 그림자에도 색상 적용
        cursor: 'pointer',
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
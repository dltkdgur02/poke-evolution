import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { typeColors } from '../typeColors';

// 타입 정의
interface PokemonType {
    type: { name: string };
}
interface PokemonNodeData {
    label: string;
    imageUrl?: string;
    defaultImageUrl?: string;
    shinyImageUrl?: string;
    types?: PokemonType[];
}
interface PokemonNodeProps {
    data: PokemonNodeData;
    id: string;
    isShiny: boolean;
    onClick: (id: string) => void;
}

function PokemonNode({ data, id, isShiny, onClick }: PokemonNodeProps) {
    const primaryType = data.types?.[0]?.type.name || 'normal';
    const color = typeColors[primaryType] || '#A8A77A';

    const nodeStyle = {
        background: 'var(--card-bg)',
        border: `3px solid ${color}`,
        borderRadius: '12px',
        padding: '15px 20px',
        width: '150px',
        textAlign: 'center' as const,
        fontSize: '18px',
        fontWeight: 'bold',
        boxShadow: `0 4px 12px ${color}40`,
        cursor: 'pointer',
    };

    const imageStyle = {
        width: '96px',
        height: '96px',
    };

    // isShiny 상태에 따라 보여줄 이미지를 결정합니다.
    const imageUrl = isShiny ? data.shinyImageUrl : data.defaultImageUrl;

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
            {/* 결정된 imageUrl을 사용합니다. */}
            <img src={imageUrl} alt={data.label} style={imageStyle} />
            <div>{data.label}</div>
            <Handle type="source" position={Position.Right} />
        </motion.div>
    );
}

export default PokemonNode;
import { motion } from 'framer-motion';
import './Sidebar.css';

// 타입 정의
type PokemonDetails = {
    koreanName: string; imageUrl: string; types: { type: { name: string; koreanName: string } }[];
    height: number; weight: number; abilities: { ability: { name: string; koreanName: string } }[];
    weaknesses: string[];
};
interface SidebarProps {
    pokemon: PokemonDetails | null;
    isOpen: boolean;
    onClose: () => void;
}

function Sidebar({ pokemon, isOpen, onClose }: SidebarProps) {
    if (!pokemon) {
        return null;
    }


    const sidebarVariants = {
        hidden: { x: '100%' },
        visible: { x: 0 },
    };

    return (
        <motion.div
            className="sidebar"
            variants={sidebarVariants}
            initial="hidden"
            animate={isOpen ? 'visible' : 'hidden'}
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <div className="sidebar-header">
                <h2>{pokemon.koreanName}</h2>
                <button onClick={onClose} className="close-btn">&times;</button>
            </div>
            <div className="sidebar-content">
                <img src={pokemon.imageUrl} alt={pokemon.koreanName} />

                <div className="info-section">
                    <h3>타입</h3>
                    <div className="info-item">
                        <span>{pokemon.types.map(t => t.type.koreanName).join(', ')}</span>
                    </div>
                </div>

                <div className="info-section">
                    <h3>약점 (2배 데미지)</h3>
                    <div className="info-item weaknesses">
                        <span>{pokemon.weaknesses.join(', ')}</span>
                    </div>
                </div>

                <div className="info-section">
                    <h3>특성</h3>
                    {pokemon.abilities.map(({ ability }) => (
                        <div key={ability.name} className="info-item">
                            <span>{ability.koreanName}</span>
                        </div>
                    ))}
                </div>

                <div className="info-section">
                    <h3>신체 정보</h3>
                    <div className="info-item">
                        <span>키</span>
                        <span>{pokemon.height / 10} m</span>
                    </div>
                    <div className="info-item">
                        <span>몸무게</span>
                        <span>{pokemon.weight / 10} kg</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
export default Sidebar;
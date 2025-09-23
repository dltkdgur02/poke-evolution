import { typeColors } from '../typeColors';
import './TypeMatchups.css';

// 타입 정의 수정
interface MatchupEntry {
    korean: string;
    english: string;
}
interface Matchups {
    '4x'?: MatchupEntry[]; '2x'?: MatchupEntry[]; '1x'?: MatchupEntry[];
    '0.5x'?: MatchupEntry[]; '0.25x'?: MatchupEntry[]; '0x'?: MatchupEntry[];
}
interface TypeMatchupsProps {
    matchups: Matchups;
}

const multiplierOrder: (keyof Matchups)[] = ['4x', '2x', '0.5x', '0.25x', '0x'];
const multiplierLabels: { [key: string]: string } = {
    '4x': '4배', '2x': '2배', '0.5x': '0.5배', '0.25x': '0.25배', '0x': '0배 (무효)'
};

// TypeBadge 컴포넌트 수정
const TypeBadge = ({ type }: { type: MatchupEntry }) => {
    // 영문 이름으로 색상을 찾고, 한글 이름으로 텍스트를 표시합니다.
    const color = typeColors[type.english] || '#A8A77A';
    return <span className="type-badge" style={{ backgroundColor: color }}>{type.korean}</span>;
};

function TypeMatchups({ matchups }: TypeMatchupsProps) {
    return (
        <div className="matchups-grid">
            {multiplierOrder.map(multiplier => (
                (matchups[multiplier] && matchups[multiplier]!.length > 0) && (
                    <>
                        <div className="multiplier">{multiplierLabels[multiplier]}:</div>
                        <div className="types-wrapper">
                            {matchups[multiplier]!.map(type => <TypeBadge key={type.english} type={type} />)}
                        </div>
                    </>
                )
            ))}
        </div>
    );
}
export default TypeMatchups;
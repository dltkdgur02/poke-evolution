import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import StatsChart, { statNameMapping } from './StatsChart';
import TypeMatchups from './TypeMatchups';
import allTypeNames from '../allTypeNames';
import './Sidebar.css';

// --- 헬퍼 함수들 (Sidebar에서 독립적으로 사용) ---
const findKoreanName = (speciesData: any, fallbackName: string) => {
    return speciesData.names.find((n: any) => n.language.name === 'ko')?.name || fallbackName;
};
type MatchupEntry = { korean: string; english: string };
type Matchups = { [key: string]: MatchupEntry[] };
const calculateCombinedDamageRelations = async (typeResponses: any[]): Promise<Matchups> => {
    const allDamageRelations = typeResponses.map(res => res.data.damage_relations);
    const multipliers: { [key: string]: number } = {};
    allTypeNames.forEach(name => multipliers[name] = 1);
    for (const relations of allDamageRelations) {
        relations.double_damage_from.forEach((type: any) => multipliers[type.name] *= 2);
        relations.half_damage_from.forEach((type: any) => multipliers[type.name] *= 0.5);
        relations.no_damage_from.forEach((type: any) => multipliers[type.name] *= 0);
    }
    const matchups: Matchups = { '4x': [], '2x': [], '0.5x': [], '0.25x': [], '0x': [] };
    const koreanTypeNamesPromises = allTypeNames.map(async name => {
        const typeRes = await axios.get(`https://pokeapi.co/api/v2/type/${name}`);
        return { english: name, korean: findKoreanName(typeRes.data, name) };
    });
    const koreanTypeNames = await Promise.all(koreanTypeNamesPromises);
    const nameMap = new Map(koreanTypeNames.map(item => [item.english, item.korean]));
    for (const typeName in multipliers) {
        const m = multipliers[typeName];
        const koreanName = nameMap.get(typeName) || typeName;
        const entry: MatchupEntry = { korean: koreanName, english: typeName };
        if (m === 4) matchups['4x'].push(entry);
        else if (m === 2) matchups['2x'].push(entry);
        else if (m === 0.5) matchups['0.5x'].push(entry);
        else if (m === 0.25) matchups['0.25x'].push(entry);
        else if (m === 0) matchups['0x'].push(entry);
    }
    return matchups;
};

// --- 타입 정의 ---
type InitialPokemonDetails = {
    koreanName: string;
    forms: { name: string; koreanName: string; url: string; }[];
};
type FormDetails = {
    koreanName: string; imageUrl: string; types: { type: { name: string; koreanName: string } }[];
    height: number; weight: number; abilities: { ability: { name: string; koreanName: string } }[];
    stats: { stat: { name: string; }; base_stat: number; }[];
    matchups: Matchups;
    weaknesses: string[];
    sprites: any;
};
interface SidebarProps {
    initialPokemon: InitialPokemonDetails | null;
    isOpen: boolean;
    onClose: () => void;
    isShiny: boolean;
    flavorText: string;
}

function Sidebar({ initialPokemon, isOpen, onClose, isShiny }: SidebarProps) {
    const [activeTab, setActiveTab] = useState('info');
    const [currentFormDetails, setCurrentFormDetails] = useState<FormDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFormDetails = async (url: string) => {
        setIsLoading(true);
        try {
            const pokemonRes = await axios.get(url);
            const speciesRes = await axios.get(pokemonRes.data.species.url);
            const typesPromises = pokemonRes.data.types.map((t: any) => axios.get(t.type.url));
            const typesResponses = await Promise.all(typesPromises);
            const matchups = await calculateCombinedDamageRelations(typesResponses);
            const weaknesses = matchups['2x']?.map(t => t.korean) || []; // 2배 약점을 따로 추출
            const typeNamesPromises = typesResponses.map(async (res, i) => ({ type: { name: pokemonRes.data.types[i].type.name, koreanName: findKoreanName(res.data, pokemonRes.data.types[i].type.name) }}));
            const typesWithKoreanNames = await Promise.all(typeNamesPromises);
            const abilitiesPromises = pokemonRes.data.abilities.map((a: any) => axios.get(a.ability.url));
            const abilitiesResponses = await Promise.all(abilitiesPromises);
            const koreanFlavorTextEntry = speciesRes.data.flavor_text_entries
                .reverse() // 최신 버전의 설명이 보통 뒤에 있으므로 배열을 뒤집음
                .find((entry: any) => entry.language.name === 'ko');
            const flavorText = koreanFlavorTextEntry
                ? koreanFlavorTextEntry.flavor_text.replace(/\s+/g, ' ') // 줄바꿈 문자를 공백으로 변경
                : '도감 설명을 찾을 수 없습니다.';
            setCurrentFormDetails({
                koreanName: findKoreanName(speciesRes.data, pokemonRes.data.name),
                imageUrl: isShiny ? pokemonRes.data.sprites.front_shiny : pokemonRes.data.sprites.front_default,
                height: pokemonRes.data.height,
                weight: pokemonRes.data.weight,
                types: typesWithKoreanNames,
                abilities: abilitiesResponses.map((res, i) => ({ ability: { name: pokemonRes.data.abilities[i].ability.name, koreanName: findKoreanName(res.data, pokemonRes.data.abilities[i].ability.name) }})),
                stats: pokemonRes.data.stats,
                matchups: matchups,
                weaknesses: weaknesses,
                sprites: pokemonRes.data.sprites,
                flavorText: flavorText,
            });
        } catch (error) {
            console.error("Failed to fetch form details", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialPokemon) {
            fetchFormDetails(initialPokemon.forms[0].url);
            setActiveTab('info');
        }
    }, [initialPokemon]);

    useEffect(() => {
        if (currentFormDetails) {
            setCurrentFormDetails(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    imageUrl: isShiny ? prev.sprites.front_shiny : prev.sprites.front_default,
                }
            });
        }
    }, [isShiny]);

    const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        fetchFormDetails(event.target.value);
    };

    if (!initialPokemon) { return null; }

    const totalStats = currentFormDetails ? currentFormDetails.stats.reduce((sum, stat) => sum + stat.base_stat, 0) : 0;
    const sidebarVariants = { hidden: { x: '100%' }, visible: { x: 0 } };

    return (
        <motion.div className="sidebar" variants={sidebarVariants} initial="hidden" animate={isOpen ? 'visible' : 'hidden'} exit="hidden" transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <div className="sidebar-header">
                <h2>{currentFormDetails ? currentFormDetails.koreanName : initialPokemon.koreanName}</h2>
                <button onClick={onClose} className="close-btn">&times;</button>
            </div>
            <div className="sidebar-content">
                {initialPokemon.forms.length > 1 && (
                    <div className="form-selector">
                        <select onChange={handleFormChange} disabled={isLoading}>
                            {initialPokemon.forms.map(form => (
                                <option key={form.name} value={form.url}>{form.koreanName}</option>
                            ))}
                        </select>
                    </div>
                )}

                {isLoading || !currentFormDetails ? (
                    <p>폼 정보를 불러오는 중...</p>
                ) : (
                    <>
                        <img src={currentFormDetails.imageUrl} alt={currentFormDetails.koreanName} />
                        <div className="tabs">
                            <button className={`tab-button ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>기본 정보</button>
                            <button className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>종족값</button>
                            <button className={`tab-button ${activeTab === 'matchups' ? 'active' : ''}`} onClick={() => setActiveTab('matchups')}>방어 상성</button>
                        </div>
                        {activeTab === 'info' && (
                            <div>
                                <div className="info-section"><h3>타입</h3><div className="info-item"><span>{currentFormDetails.types.map(t => t.type.koreanName).join(', ')}</span></div></div>
                                <div className="info-section">
                                    <h3>약점 (2배)</h3>
                                    <div className="info-item weaknesses"><span>{currentFormDetails.weaknesses.join(', ')}</span></div>
                                </div>
                                <div className="info-section"><h3>특성</h3>{currentFormDetails.abilities.map(({ ability }) => (<div key={ability.name} className="info-item"><span>{ability.koreanName}</span></div>))}</div>
                                <div className="info-section"><h3>신체 정보</h3><div className="info-item"><span>키</span><span>{currentFormDetails.height / 10} m</span></div><div className="info-item"><span>몸무게</span><span>{currentFormDetails.weight / 10} kg</span></div></div>
                                <div className="info-section">
                                    <h3>도감 설명</h3>
                                    <p className="flavor-text">{currentFormDetails.flavorText}</p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'stats' && (
                            <div className="info-section">
                                <h3>종족값</h3>
                                <StatsChart stats={currentFormDetails.stats} />
                                <div className="stats-list">
                                    {currentFormDetails.stats.map(stat => (
                                        <div className="info-item" key={stat.stat.name}>
                                            <span>{statNameMapping[stat.stat.name] || stat.stat.name}</span>
                                            <span>{stat.base_stat}</span>
                                        </div>
                                    ))}
                                    <div className="info-item stats-total">
                                        <span>총합</span>
                                        <span>{totalStats}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'matchups' && (
                            <div className="info-section">
                                <h3>방어 상성</h3>
                                <TypeMatchups matchups={currentFormDetails.matchups} />
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}
export default Sidebar;
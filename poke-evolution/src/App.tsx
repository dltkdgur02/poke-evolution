import { useState, useMemo } from 'react';
import axios from 'axios';
import { parseEvolutionChain, type EvolutionTreeNode } from './utils';
import ReactFlow, { MiniMap, Controls, Background, type NodeProps } from 'reactflow';
import { AnimatePresence } from 'framer-motion';
import 'reactflow/dist/style.css';
import PokemonNode from './components/PokemonNode';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import koreanNameMap from './koreanNameMap.json';
import './App.css';
import dagre from 'dagre';

// 헬퍼 함수: 진화 조건 포맷팅
const formatEvolutionDetails = (details: any[]): string => {
    if (!details || details.length === 0) return '';
    const detail = details[0];
    const trigger = detail.trigger.name.replace('-', ' ');
    if (trigger === 'level up') {
        if (!detail.min_level) return trigger;
        return `Lv. ${detail.min_level}`;
    }
    if (trigger === 'use item') return `Use ${detail.item.name.replace('-', ' ')}`;
    if (trigger === 'trade') return 'Trade';
    return trigger;
};

// 헬퍼 함수: Dagre 레이아웃 계산
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 200;
const nodeHeight = 200;
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    dagreGraph.setGraph({ rankdir: direction });
    nodes.forEach((node) => dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight }));
    edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
    dagre.layout(dagreGraph);
    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y - nodeHeight / 2 };
    });
    return { nodes, edges };
};

// 타입 정의
type PokemonType = { type: { name: string; url: string } };
type NodeData = { label: string; imageUrl: string; types?: PokemonType[] };
type Node = { id: string; type?: string; position: { x: number; y: number }; data: NodeData; };
type Edge = { id: string; source: string; target: string; animated: boolean; label?: string; labelStyle?: object; labelBgStyle?: object; };
type PokemonDetails = {
    koreanName: string; imageUrl: string; types: { type: { name: string; koreanName: string } }[];
    height: number; weight: number; abilities: { ability: { name: string; koreanName: string } }[];
    cryUrl: string | null;
    weaknesses: string[];
};

// 헬퍼 함수: 트리 구조를 노드/엣지 배열로 변환
const createFlowElementsFromTree = (treeNode: EvolutionTreeNode) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const traverse = (node: EvolutionTreeNode, parentName: string | null) => {
        nodes.push({ id: node.name, type: 'pokemonNode', position: { x: 0, y: 0 }, data: { label: node.name, imageUrl: '' } });
        if (parentName) {
            const evolutionLabel = formatEvolutionDetails(node.evolutionDetails);
            edges.push({ id: `${parentName}-${node.name}`, source: parentName, target: node.name, animated: true, label: evolutionLabel,
                labelStyle: { fill: '#000', fontWeight: 500 }, labelBgStyle: { fill: 'rgba(255, 255, 255, 0.7)', padding: '5px' },
            });
        }
        node.children.forEach(child => traverse(child, node.name));
    };
    traverse(treeNode, null);
    return { nodes, edges };
};

function App() {
    const [pokemonName, setPokemonName] = useState('');
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);

    const handleNodeClick = async (id: string) => {
        setIsLoading(true);
        try {
            const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
            const pokemonRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const cryUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/cries/${pokemonRes.data.id}.ogg`;
            const findKoreanName = (data: any, nameKey: string) => data.names.find((n: any) => n.language.name === 'ko')?.name || nameKey;

            const typesPromises = pokemonRes.data.types.map((t: any) => axios.get(t.type.url));
            const typesResponses = await Promise.all(typesPromises);

            const allWeaknesses = new Set<string>();
            const typeNamesPromises = typesResponses.map(async (res, i) => {
                const damageRelations = res.data.damage_relations.double_damage_from;
                const weaknessNamesPromises = damageRelations.map(async (w: any) => {
                    const weaknessTypeRes = await axios.get(w.url);
                    return findKoreanName(weaknessTypeRes.data, w.name);
                });
                const weaknessNames = await Promise.all(weaknessNamesPromises);
                weaknessNames.forEach(name => allWeaknesses.add(name));
                return { type: { name: pokemonRes.data.types[i].type.name, koreanName: findKoreanName(res.data, pokemonRes.data.types[i].type.name) }};
            });
            const typesWithKoreanNames = await Promise.all(typeNamesPromises);
            const weaknesses = Array.from(allWeaknesses);

            const abilitiesPromises = pokemonRes.data.abilities.map((a: any) => axios.get(a.ability.url));
            const abilitiesResponses = await Promise.all(abilitiesPromises);

            const details: PokemonDetails = {
                koreanName: findKoreanName(speciesRes.data, pokemonRes.data.name),
                imageUrl: pokemonRes.data.sprites.front_default,
                height: pokemonRes.data.height, weight: pokemonRes.data.weight,
                types: typesWithKoreanNames,
                abilities: abilitiesResponses.map((res, i) => ({ ability: { name: pokemonRes.data.abilities[i].ability.name, koreanName: findKoreanName(res.data, pokemonRes.data.abilities[i].ability.name) }})),
                cryUrl: cryUrl,
                weaknesses: weaknesses,
            };
            setSelectedPokemon(details);
            setIsSidebarOpen(true);
        } catch (error) {
            console.error("Failed to fetch pokemon details:", error);
            alert("포켓몬의 상세 정보를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const nodeTypes = useMemo(() => ({
        pokemonNode: (props: NodeProps) => (
            <PokemonNode {...props} onClick={handleNodeClick} />
        ),
    }), []);

    const handleSearch = async (pokemonIdentifier?: string) => {
        const searchInput = pokemonIdentifier || pokemonName;
        if (!searchInput) {
            alert('포켓몬 이름을 입력해주세요!');
            return;
        }
        setIsLoading(true);
        setIsSidebarOpen(false);
        const lowerCaseName = searchInput.toLowerCase().trim();
        const searchTarget = (koreanNameMap as { [key: string]: string })[lowerCaseName] || lowerCaseName;
        try {
            const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${searchTarget}`);
            const evolutionChainUrl = speciesResponse.data.evolution_chain.url;
            const evolutionResponse = await axios.get(evolutionChainUrl);
            const evolutionTree = parseEvolutionChain(evolutionResponse.data);
            const { nodes: initialNodes, edges: initialEdges } = createFlowElementsFromTree(evolutionTree);
            const pokemonDataPromises = initialNodes.map(node => axios.get(`https://pokeapi.co/api/v2/pokemon/${node.id}`));
            const pokemonDataResponses = await Promise.all(pokemonDataPromises);

            const pokemonDetailsMap = new Map();
            const findKoreanName = (species: any) => species.data.names.find((name: any) => name.language.name === 'ko')?.name || species.data.name;

            const speciesPromises = pokemonDataResponses.map(res => axios.get(res.data.species.url));
            const speciesResponses = await Promise.all(speciesPromises);

            pokemonDataResponses.forEach((pokemonRes, index) => {
                pokemonDetailsMap.set(pokemonRes.data.name, {
                    koreanName: findKoreanName(speciesResponses[index].data),
                    imageUrl: pokemonRes.data.sprites.front_default,
                    types: pokemonRes.data.types,
                });
            });

            initialNodes.forEach(node => {
                const details = pokemonDetailsMap.get(node.id);
                if (details) {
                    node.data.label = details.koreanName;
                    node.data.imageUrl = details.imageUrl;
                    node.data.types = details.types;
                }
            });
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        } catch (error) {
            alert('포켓몬을 찾을 수 없습니다. 이름을 확인해주세요.');
            console.error('Error fetching pokemon data:', error);
            setNodes([]);
            setEdges([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRandomPokemon = async () => { /* ... 이전과 동일 ... */ };
    const handleSubmit = (event: React.FormEvent) => { /* ... 이전과 동일 ... */ };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div className="search-container">
                <form className="search-box" onSubmit={handleSubmit}>
                    <input
                        className="search-input"
                        type="text"
                        value={pokemonName}
                        onChange={(e) => setPokemonName(e.target.value)}
                        placeholder="포켓몬 이름..."
                        disabled={isLoading}
                    />
                    <button className="search-button" type="submit" disabled={isLoading}>
                        {isLoading ? '검색 중...' : '검색'}
                    </button>
                    <button className="random-button" type="button" onClick={handleRandomPokemon} disabled={isLoading}>
                        오늘의 포켓몬은?
                    </button>
                </form>
            </div>

            {nodes.length === 0 && !isLoading ? (
                <WelcomeScreen />
            ) : (
                <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
                    <MiniMap />
                    <Controls />
                    <Background />
                </ReactFlow>
            )}

            <AnimatePresence>
                {isSidebarOpen && (
                    <Sidebar
                        pokemon={selectedPokemon}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
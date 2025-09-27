import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { parseEvolutionChain, type EvolutionTreeNode } from './utils';
import { ReactFlowProvider, type NodeProps } from 'reactflow';
import { AnimatePresence, motion } from 'framer-motion';
import 'reactflow/dist/style.css';
import PokemonNode from './components/PokemonNode';
import Sidebar from './components/Sidebar';
import WelcomeScreen from './components/WelcomeScreen';
import FlowCanvas from './components/FlowCanvas';
import CustomEdge from './components/CustomEdge';
import koreanNameMap from './koreanNameMap.json';
import GuessingGame from './components/GuessingGame';
import { auth, db } from './firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import './MainApp.css';
import dagre from 'dagre';

// --- 헬퍼 함수들을 MainApp 컴포넌트 밖으로 이동하여 정리 ---
const findKoreanName = (speciesData: any, fallbackName: string) => {
    return speciesData.names.find((n: any) => n.language.name === 'ko')?.name || fallbackName;
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 200;
const nodeHeight = 200;
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    // 🔽 이 부분에 ranksep과 nodesep 옵션을 추가합니다.
    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: 150, // 레벨 간의 수평 간격 (기본값 50)
        nodesep: 50,  // 같은 레벨의 노드 간 수직 간격 (기본값 50)
    });
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
type NodeData = { label: string; imageUrl?: string; defaultImageUrl?: string; shinyImageUrl?: string; types?: PokemonType[] };
type Node = { id: string; type?: string; position: { x: number; y: number }; data: NodeData; };
type Edge = { id: string; source: string; target: string; type?: 'custom'; data?: any; };
type PokemonDetails = {
    koreanName: string;
    forms: { name: string; koreanName: string; url: string; }[];
};

const createFlowElementsFromTree = (treeNode: EvolutionTreeNode) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const traverse = (node: EvolutionTreeNode, parentName: string | null) => {
        nodes.push({ id: node.name, type: 'pokemonNode', position: { x: 0, y: 0 }, data: { label: node.name } });
        if (parentName) {
            edges.push({
                id: `${parentName}-${node.name}`,
                source: parentName,
                target: node.name,
                type: 'custom',
                data: { details: node.evolutionDetails[0] }, // 'label' 속성을 삭제하고 data만 사용합니다.
            });
        }
        node.children.forEach(child => traverse(child, node.name));
    };
    traverse(treeNode, null);
    return { nodes, edges };
};

function MainApp() {

    const user = auth.currentUser;
    const [pokemonName, setPokemonName] = useState('');
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetails | null>(null);
    const [isShiny, setIsShiny] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const handleLogout = () => {
        signOut(auth);
    };
    const [nickname, setNickname] = useState('');
    const [isRankingOpen, setIsRankingOpen] = useState(false);
    const [rankings, setRankings] = useState<any[]>([]);

    useEffect(() => {
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleNicknameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (user && nickname) {
            try {
                await updateProfile(user, { displayName: nickname });
                // 강제로 페이지를 새로고침하여 닉네임 변경을 반영합니다.
                window.location.reload();
            } catch (error) {
                console.error("Error updating profile:", error);
            }
        }
    };

    const handleGameComplete = async (score: number) => {
        if (user) {
            try {
                await addDoc(collection(db, "rankings"), {
                    username: user.displayName || user.email,
                    score: score,
                    timestamp: serverTimestamp(),
                });
            } catch (error) {
                console.error("Error adding document: ", error);
            }
        }
        setIsQuizOpen(false);
        showRankings();
    };;

    const showRankings = async () => {
        const q = query(collection(db, "rankings"), orderBy("score", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const fetchedRankings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRankings(fetchedRankings);
        setIsRankingOpen(true);
    };

    if (user && !user.displayName) {
        return (
            <div className="auth-container">
                <div className="auth-box">
                    <h2>환영합니다! 사용할 닉네임을 정해주세요.</h2>
                    <form onSubmit={handleNicknameUpdate} className="auth-form">
                        <input className="auth-input" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임" required />
                        <button type="submit" className="auth-button">닉네임 설정</button>
                    </form>
                </div>
            </div>
        );
    }

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    useEffect(() => {
        setNodes(prevNodes => prevNodes.map(node => ({
            ...node,
            data: { ...node.data, imageUrl: isShiny ? node.data.shinyImageUrl : node.data.defaultImageUrl }
        })));
    }, [isShiny]);

    const handleNodeClick = async (id: string) => {
        setIsLoading(true);
        try {
            const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);

            const formPromises = speciesRes.data.varieties.map(async (variety: any) => {
                const pokemonRes = await axios.get(variety.pokemon.url);
                const formDetailsUrl = pokemonRes.data.forms[0].url;
                const formDetailsRes = await axios.get(formDetailsUrl);
                const koreanFormName = formDetailsRes.data.form_names.find((n: any) => n.language.name === 'ko')?.name;
                const finalKoreanName = koreanFormName && koreanFormName.trim() !== ""
                    ? koreanFormName
                    : findKoreanName(speciesRes.data, variety.pokemon.name);

                return {
                    name: variety.pokemon.name,
                    koreanName: finalKoreanName,
                    url: variety.pokemon.url,
                };
            });
            const forms = await Promise.all(formPromises);

            const details: PokemonDetails = {
                koreanName: findKoreanName(speciesRes.data, id),
                forms: forms,
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
            <PokemonNode {...props} isShiny={isShiny} onClick={handleNodeClick} />
        ),
    }), [isShiny]);

    const edgeTypes = useMemo(() => ({
        custom: CustomEdge,
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

            const pokemonDetailsPromises = initialNodes.map(async (node) => {
                const speciesForNodeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${node.id}`);
                const defaultFormName = speciesForNodeRes.data.varieties.find((v: any) => v.is_default)?.pokemon.name || node.id;
                const pokemonRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${defaultFormName}`);
                return {
                    speciesName: node.id,
                    koreanName: findKoreanName(speciesForNodeRes.data, pokemonRes.data.name),
                    defaultImageUrl: pokemonRes.data.sprites.front_default,
                    shinyImageUrl: pokemonRes.data.sprites.front_shiny,
                    types: pokemonRes.data.types,
                };
            });

            const allPokemonDetails = await Promise.all(pokemonDetailsPromises);

            allPokemonDetails.forEach((details) => {
                const targetNode = initialNodes.find(n => n.id === details.speciesName);
                if(targetNode) {
                    targetNode.data.label = details.koreanName;
                    targetNode.data.defaultImageUrl = details.defaultImageUrl;
                    targetNode.data.shinyImageUrl = details.shinyImageUrl;
                    targetNode.data.imageUrl = isShiny ? details.shinyImageUrl : details.defaultImageUrl;
                    targetNode.data.types = details.types;
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

    const handleRandomPokemon = async () => {
        setIsLoading(true);
        try {
            const MAX_POKEMON_ID = 1025;
            const randomId = Math.floor(Math.random() * MAX_POKEMON_ID) + 1;
            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`);
            await handleSearch(res.data.name);
        } catch (error) {
            console.error("Failed to fetch random pokemon:", error);
            await handleRandomPokemon();
        }
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        handleSearch();
    };

    return (
        <div style={{ width: '100vw', height: '100vh' }}>

            <div className="user-info-container">
                <p>{auth.currentUser?.displayName || auth.currentUser?.email}님, 환영합니다!</p>
                <button className="logout-button" onClick={handleLogout}>로그아웃</button>
            </div>

            <div className="search-container">
                <h1>포켓몬스터 진화 살펴보기</h1>
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
                <button className="quiz-button" onClick={() => setIsQuizOpen(true)}>
                    도감 퀴즈!
                </button>
                <div className="shiny-toggle-container">
                    <span>이로치 모드</span>
                    <label className="switch">
                        <input type="checkbox" checked={isShiny} onChange={() => setIsShiny(!isShiny)} />
                        <span className="slider"></span>
                    </label>
                </div>
                <div className="theme-toggle-container">
                    <span>{theme === 'light' ? '☀️ 라이트' : '🌙 다크'} 모드</span>
                    <label className="switch">
                        <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            <ReactFlowProvider>
                {nodes.length === 0 && !isLoading ? (
                    <WelcomeScreen />
                ) : (
                    <FlowCanvas
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                    />
                )}
            </ReactFlowProvider>

            <AnimatePresence>
                {isSidebarOpen && (
                    <Sidebar
                        initialPokemon={selectedPokemon}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        isShiny={isShiny}

                    />
                )}
                {isQuizOpen && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.7, opacity: 0 }}
                        >
                            <button className="modal-close-btn" onClick={() => setIsQuizOpen(false)}>&times;</button>
                            <GuessingGame onGameComplete={handleGameComplete} />
                        </motion.div>

                    </motion.div>

                )}
                {isRankingOpen && (
                    <motion.div className="modal-overlay" /* ... */ >
                        <motion.div className="modal-content" /* ... */ >
                            <button className="modal-close-btn" onClick={() => setIsRankingOpen(false)}>&times;</button>
                            <h2>🏆 명예의 전당 🏆</h2>
                            <ol>
                                {rankings.map((r, i) => <li key={r.id}>{i + 1}. {r.username}: {r.score}점</li>)}
                            </ol>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default MainApp;
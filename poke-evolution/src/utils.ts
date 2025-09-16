// API 응답의 타입을 정의합니다.
interface ApiChainLink {
    species: {
        name: string;
        url: string;
    };
    evolves_to: ApiChainLink[];
    evolution_details: any[];
}

// 우리가 만들 트리 노드의 타입을 정의합니다.
export interface EvolutionTreeNode {
    id: string;
    name: string;
    evolutionDetails: any[];
    children: EvolutionTreeNode[];
}

// 재귀적으로 호출될 헬퍼 함수
function buildEvolutionTree(chainLink: ApiChainLink): EvolutionTreeNode {
    const urlParts = chainLink.species.url.split('/');
    const id = urlParts[urlParts.length - 2];

    const node: EvolutionTreeNode = {
        id: id,
        name: chainLink.species.name,
        evolutionDetails: chainLink.evolution_details,
        children: [],
    };

    if (chainLink.evolves_to && chainLink.evolves_to.length > 0) {
        node.children = chainLink.evolves_to.map(childLink => buildEvolutionTree(childLink));
    }

    return node;
}

// 최종적으로 호출될 메인 함수
export const parseEvolutionChain = (chainData: { chain: ApiChainLink }): EvolutionTreeNode => {
    return buildEvolutionTree(chainData.chain);
};
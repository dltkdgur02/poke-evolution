interface ApiChainLink {
    species: {
        name: string;
        url: string;
    };
    evolves_to: ApiChainLink[];
    evolution_details: any[];
}
export interface EvolutionTreeNode {
    id: string;
    name: string;
    evolutionDetails: any[];
    children: EvolutionTreeNode[];
}
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
export const parseEvolutionChain = (chainData: { chain: ApiChainLink }): EvolutionTreeNode => {
    return buildEvolutionTree(chainData.chain);
};
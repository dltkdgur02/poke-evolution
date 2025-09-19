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

// 상세 진화 조건을 포맷하는 함수
export const formatEvolutionDetails = (details: any[]): string => {
    if (!details || details.length === 0) return '';
    const detail = details[0];
    const trigger = detail.trigger.name.replace('-', ' ');

    let conditions: string[] = [];

    // 레벨업 조건
    if (trigger === 'level up') {
        if (detail.min_level) conditions.push(`레벨 ${detail.min_level}`);
        if (detail.held_item) conditions.push(`${detail.held_item.name.replace('-', ' ')} 지닌 채`);
        if (detail.time_of_day === 'day') conditions.push('낮');
        if (detail.time_of_day === 'night') conditions.push('밤');
        if (detail.location) conditions.push(`${detail.location.name.replace('-', ' ')}에서`);
        if (detail.known_move_type) conditions.push(`${detail.known_move_type.name} 타입 기술 배운 후`);
        if (detail.min_happiness) conditions.push(`친밀도 ${detail.min_happiness} 이상`);
        if (detail.min_affection) conditions.push(`어루만지기 ${detail.min_affection} 이상`);
        if (detail.min_beauty) conditions.push(`아름다움 ${detail.min_beauty} 이상`);
        if (detail.gender === 1) conditions.push('암컷일 때');
        if (detail.gender === 2) conditions.push('수컷일 때');
        if (detail.relative_physical_stats === 1) conditions.push('공격 > 방어');
        if (detail.relative_physical_stats === 0) conditions.push('공격 = 방어');
        if (detail.relative_physical_stats === -1) conditions.push('공격 < 방어');
        if (detail.party_species) conditions.push(`${detail.party_species.name} 포켓몬과 함께`);
        if (detail.party_type) conditions.push(`${detail.party_type.name} 타입 포켓몬과 함께`);
        if (detail.needs_overworld_rain) conditions.push('비 내리는 필드에서');
        if (detail.turn_upside_down) conditions.push('본체를 거꾸로');

        if (conditions.length === 0) return '레벨업';
        return `레벨업 (${conditions.join(', ')})`;
    }
    // 아이템 사용 진화
    else if (trigger === 'use item' && detail.item) {
        return `${detail.item.name.replace('-', ' ')} 사용`;
    }
    // 통신 교환 진화
    else if (trigger === 'trade') {
        if (detail.held_item) return `${detail.held_item.name.replace('-', ' ')} 지닌 채 교환`;
        if (detail.trade_species) return `${detail.trade_species.name}와 교환`;
        return '통신 교환';
    }
    // 기타 진화
    else if (detail.known_move) {
        return `${detail.known_move.name.replace('-', ' ')} 기술 배운 후`;
    }
    // 예상치 못한 트리거
    else {
        return `${trigger}`;
    }
};
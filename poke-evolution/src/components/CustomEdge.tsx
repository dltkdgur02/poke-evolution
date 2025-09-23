import { getBezierPath, EdgeLabelRenderer, BaseEdge, type EdgeProps } from 'reactflow';
import './CustomEdge.css';

const triggerIcons: { [key: string]: string } = {
    'level-up': '⬆️', 'trade': '🔄', 'use-item': '💎', 'shed': '🍃',
};

function formatDetails(details: any) {
    if (!details) return null;

    const trigger = details.trigger.name;
    let text = '';

    if (trigger === 'level-up') {
        if (details.min_level) text = `Lv. ${details.min_level}`;
        else text = 'Level Up';
    }
    else if (trigger === 'use-item' && details.item) text = details.item.name.replace('-', ' ');
    else if (trigger === 'trade') text = 'Trade';
    else text = trigger.replace('-', ' ');

    if (details.time_of_day) text += ` (${details.time_of_day})`;
    if (details.held_item) text += ` w/ ${details.held_item.name.replace('-', ' ')}`;

    return { icon: triggerIcons[trigger] || '⭐', text };
}

export default function CustomEdge({
                                       id,
                                       sourceX,
                                       sourceY,
                                       targetX,
                                       targetY,
                                       sourcePosition,
                                       targetPosition,
                                       data,
                                   }: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });

    const formattedDetails = formatDetails(data?.details);

    return (
        <>
            <BaseEdge id={id} path={edgePath} />
            {formattedDetails && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                    >
                        <div className="edge-badge">
                            <span>{formattedDetails.icon}</span>
                            <span>{formattedDetails.text}</span>
                        </div>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
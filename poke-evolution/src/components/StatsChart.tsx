import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

type Stat = {
    stat: { name: string };
    base_stat: number;
};

interface StatsChartProps {
    stats: Stat[];
}

export const statNameMapping: { [key: string]: string } = {
    'hp': 'HP',
    'attack': '공격',
    'defense': '방어',
    'special-attack': '특공',
    'special-defense': '특방',
    'speed': '스피드',
};

function StatsChart({ stats }: StatsChartProps) {
    const chartData = stats.map(stat => ({
        subject: statNameMapping[stat.stat.name] || stat.stat.name,
        value: stat.base_stat,
        fullMark: 200, // 차트의 최대값
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 200]} tick={false} axisLine={false} />
                <Radar name="종족값" dataKey="value" stroke="#1DB954" fill="#1DB954" fillOpacity={0.6} />
                <Tooltip />
            </RadarChart>
        </ResponsiveContainer>
    );
}

export default StatsChart;
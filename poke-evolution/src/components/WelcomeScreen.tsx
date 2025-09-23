import './WelcomeScreen.css';
function WelcomeScreen() {
    return (
        <div className="welcome-container">
            <svg className="pokeball-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#555" strokeWidth="4"/>
                <path d="M4,50 A46,46 0 0,1 96,50" fill="#EF5350" stroke="#555" strokeWidth="0"/>
                <path d="M4,50 A46,46 0 0,0 96,50" fill="white" stroke="#555" strokeWidth="0"/>
                <line x1="2" y1="50" x2="98" y2="50" stroke="#555" strokeWidth="4"/>
                <circle cx="50" cy="50" r="15" fill="none" stroke="#555" strokeWidth="4"/>
                <circle cx="50" cy="50" r="8" fill="white" stroke="#555" strokeWidth="2"/>
            </svg>
            <h2>진화 과정을 탐험해 보세요!</h2>
            <p>포켓몬 이름을 검색하거나 '오늘의 포켓몬'을 뽑아보세요.</p>
        </div>
    );
}
export default WelcomeScreen;
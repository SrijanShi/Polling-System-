import './WaitingRoom.css';

export const WaitingRoom: React.FC = () => {
  return (
    <div className="waiting-room">
      <div className="intervue-badge">⚡ Intervue Poll</div>
      <div className="wr-spinner" />
      <h2>Wait for the teacher to ask questions..</h2>
    </div>
  );
};

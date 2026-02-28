import { getKickedName } from '../../utils/session';
import './KickedPage.css';

export const KickedPage = () => {
  return (
    <div className="kicked-page">
      <div className="intervue-badge">⚡ Intervue Poll</div>
      <h1>You've been Kicked out !</h1>
      <p>{getKickedName() ? `Hi ${getKickedName()}, l` : 'L'}ooks like the teacher had removed you from the poll system. Please Try again sometime.</p>
    </div>
  );
};


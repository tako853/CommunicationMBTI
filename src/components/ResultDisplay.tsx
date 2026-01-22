import { CommunicationType, CommunicationAxisScores } from '../types/analysis';
import { getTypeInfo } from '../data/communicationTypes';

interface ResultDisplayProps {
  type: CommunicationType;
  scores: CommunicationAxisScores;
}

const axisLabels = {
  assertiveness: { high: 'Assert (主張型)', low: 'Reserved (省察型)', name: '伝える力' },
  listening: { high: 'Connect (共鳴型)', low: 'Distill (要点抽出型)', name: '聞く力' },
  nonverbalExpression: { high: 'Faceful (表情型)', low: 'Subtle (気配型)', name: '非言語を伝える力' },
  nonverbalReading: { high: 'Perceptive (察知型)', low: 'Tell-me (明示待ち型)', name: '非言語を読み取る力' },
};

export const ResultDisplay = ({ type, scores }: ResultDisplayProps) => {
  const typeInfo = getTypeInfo(type);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>あなたのコミュニケーションタイプ</h2>

      {/* タイプ画像 */}
      <div style={styles.imageContainer}>
        <img
          src={typeInfo.imagePath}
          alt={typeInfo.type}
          style={styles.typeImage}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* タイプコードと名前 */}
      <div style={styles.typeHeader}>
        <span style={styles.typeCode}>{typeInfo.type}</span>
        <span style={styles.typeName}>{typeInfo.name}</span>
      </div>

      {/* 説明 */}
      <p style={styles.description}>{typeInfo.description}</p>

      {/* 4軸のスコア */}
      <div style={styles.axesSection}>
        <h3 style={styles.sectionTitle}>各軸のスコア</h3>
        {(Object.keys(scores) as (keyof CommunicationAxisScores)[]).map((axis) => (
          <div key={axis} style={styles.axisRow}>
            <div style={styles.axisLabel}>{axisLabels[axis].name}</div>
            <div style={styles.axisBar}>
              <div style={styles.axisBarLabels}>
                <span>{axisLabels[axis].low}</span>
                <span>{axisLabels[axis].high}</span>
              </div>
              <div style={styles.barContainer}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${scores[axis]}%`,
                  }}
                />
                <div
                  style={{
                    ...styles.barIndicator,
                    left: `${scores[axis]}%`,
                  }}
                />
              </div>
              <div style={styles.scoreValue}>{scores[axis]}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* 強み */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>強み</h3>
        <ul style={styles.list}>
          {typeInfo.strengths.map((strength, index) => (
            <li key={index} style={styles.listItem}>
              {strength}
            </li>
          ))}
        </ul>
      </div>

      {/* 注意点 */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>注意点</h3>
        <ul style={styles.list}>
          {typeInfo.cautions.map((caution, index) => (
            <li key={index} style={styles.listItem}>
              {caution}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'sans-serif',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  imageContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  typeImage: {
    maxWidth: '200px',
    maxHeight: '200px',
    objectFit: 'contain',
    display: 'block',
  },
  typeHeader: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  typeCode: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginRight: '12px',
  },
  typeName: {
    fontSize: '24px',
    color: '#666',
  },
  description: {
    fontSize: '16px',
    lineHeight: '1.6',
    textAlign: 'center',
    marginBottom: '24px',
    color: '#333',
  },
  axesSection: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    borderBottom: '2px solid #333',
    paddingBottom: '4px',
  },
  axisRow: {
    marginBottom: '16px',
  },
  axisLabel: {
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  axisBar: {
    position: 'relative',
  },
  axisBarLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  barContainer: {
    position: 'relative',
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'visible',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
  barIndicator: {
    position: 'absolute',
    top: '-2px',
    width: '4px',
    height: '24px',
    backgroundColor: '#333',
    borderRadius: '2px',
    transform: 'translateX(-50%)',
  },
  scoreValue: {
    textAlign: 'right',
    fontSize: '14px',
    fontWeight: 'bold',
    marginTop: '4px',
  },
  section: {
    marginBottom: '20px',
  },
  list: {
    paddingLeft: '20px',
    margin: 0,
  },
  listItem: {
    marginBottom: '8px',
    lineHeight: '1.4',
  },
};

import {Composition} from 'remotion';
import {Ad} from './Ad';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CelebSmileAd"
      component={Ad}
      durationInFrames={600}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

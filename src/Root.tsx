import {Composition} from 'remotion';
import {Ad} from './Ad';
import {Ad7} from './Ad7';
import {Ad10} from './Ad10';

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="CelebSmileAd"
      component={Ad}
      durationInFrames={600}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition id="CelebSmileProduct7s" component={Ad7} durationInFrames={210} fps={30} width={1080} height={1920} />
    <Composition id="CelebSmileStraighten10s" component={Ad10} durationInFrames={300} fps={30} width={1080} height={1920} />
    </>
  );
};

import React from 'react';
import ReactBeforeSliderComponent from 'react-before-after-slider-component';
import 'react-before-after-slider-component/dist/build.css';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterSliderComponent: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage }) => {
  const FIRST_IMAGE = {
    imageUrl: beforeImage
  };
  const SECOND_IMAGE = {
    imageUrl: afterImage
  };

  return (
    <div className="before-after-slider">
      <ReactBeforeSliderComponent
        firstImage={FIRST_IMAGE}
        secondImage={SECOND_IMAGE}
      />
    </div>
  );
};

export default BeforeAfterSliderComponent;
import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import logo from '../src/assets/susold_logo.PNG'; 

const MainCarousel = () => {
  const settings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: false
  };

  return (
    <div style={{ margin: '20px auto', width: '90%', maxWidth: '1200px' }}>
      <Slider {...settings}>
        <div style={{ textAlign: 'center' }}>
          <img
            src={logo}
            alt="Susold Banner"
            style={{
              width: '100%',
              height: '240px',              
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backgroundColor: '#fff'
            }}
          />
        </div>
      </Slider>
    </div>
  );
};

export default MainCarousel;
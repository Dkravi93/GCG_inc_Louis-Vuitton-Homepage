import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import SEO from "../components/SEO";

const campaigns = [
  {
    id: 1,
    type: 'video',
    src: 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=139&oauth2_token_id=57447761',
    title: 'Heritage Collection',
    subtitle: 'Timeless designs inspired by decades of craftsmanship',
    cta: 'Discover Heritage',
    link: '/collections/heritage'
  },
  {
    id: 2,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1920&h=1080&fit=crop',
    title: 'Summer Essentials',
    subtitle: 'Premium sunglasses for the modern adventurer',
    cta: 'Shop Summer',
    link: '/collections/sunglasses'
  },
  {
    id: 3,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1920&h=1080&fit=crop',
    title: 'Limited Edition',
    subtitle: 'Exclusive frames available for a limited time',
    cta: 'View Limited Edition',
    link: '/collections/limited-edition'
  }
];

const categories = [
  {
    name: 'Sunglasses',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=500&fit=crop',
    link: '/collections/sunglasses'
  },
  {
    name: 'Optical',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=500&fit=crop',
    link: '/collections/optical'
  },
  {
    name: 'New Arrivals',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=500&fit=crop',
    link: '/collections/new-arrivals'
  },
  {
    name: 'Heritage',
    image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=400&h=500&fit=crop',
    link: '/collections/heritage'
  }
];

export default function HomePage() {
  const [currentCampaign, setCurrentCampaign] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        setCurrentCampaign((prev) => (prev + 1) % campaigns.length);
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const nextCampaign = () => {
    setCurrentCampaign((prev) => (prev + 1) % campaigns.length);
  };

  const prevCampaign = () => {
    setCurrentCampaign((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  };

  const campaign = campaigns[currentCampaign];

  return (
    <>
      <SEO
        title="Luxury Eyewear Collection - Premium Sunglasses & Optical Frames"
        description="Discover GCG's exclusive collection of luxury eyewear. Premium sunglasses, optical frames, and limited edition pieces crafted with exceptional quality and timeless design."
        keywords="luxury eyewear, premium sunglasses, optical frames, designer glasses, luxury sunglasses, high-end eyewear, GCG eyewear"
        type="website"
      />
      <div className="min-h-screen">
      {/* Hero Section with Dynamic Campaigns */}
      <section className="relative h-screen w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {campaign.type === 'video' ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
                onLoadedData={() => isPlaying && videoRef.current?.play()}
              >
                <source src={campaign.src} type="video/mp4" />
              </video>
            ) : (
              <img
                src={campaign.src}
                alt={campaign.title}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 from-black/60 via-black/20 to-black/40" />
          </motion.div>
        </AnimatePresence>

        {/* Hero Content */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
          <motion.div
            key={`content-${campaign.id}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-6xl"
          >
            <h1 className="mb-6 text-6xl font-extralight tracking-tight md:text-8xl lg:text-9xl">
              {campaign.title}
            </h1>
            <p className="mb-12 text-xl font-light md:text-2xl max-w-2xl mx-auto">
              {campaign.subtitle}
            </p>
            <Link
              to={campaign.link}
              className="group inline-flex items-center gap-3 rounded-full border border-white/20 px-8 py-4 text-lg font-medium backdrop-blur-sm transition-all hover:bg-white hover:text-black"
            >
              {campaign.cta}
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* Campaign Controls */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-6">
          <button
            onClick={prevCampaign}
            className="rounded-full border border-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Previous campaign"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex gap-2">
            {campaigns.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCampaign(index)}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index === currentCampaign ? 'bg-white' : 'bg-white/30'
                }`}
                aria-label={`Go to campaign ${index + 1}`}
              />
            ))}
          </div>
          
          <button
            onClick={nextCampaign}
            className="rounded-full border border-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Next campaign"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          {campaign.type === 'video' && (
            <button
              onClick={togglePlayPause}
              className="rounded-full border border-white/20 p-3 backdrop-blur-sm transition-colors hover:bg-white/20 ml-4"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}
        </div>
      </section>

      {/* Shop by Category Section */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extralight tracking-tight md:text-6xl mb-6">
              Shop by Category
            </h2>
            <p className="text-xl max-w-2xl mx-auto">
              Discover our curated collections of premium eyewear designed for every lifestyle
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Link to={category.link} className="block">
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-2xl font-light tracking-wide">{category.name}</h3>
                      <div className="mt-4 inline-flex items-center gap-2 text-sm uppercase tracking-wider">
                        Explore
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial Storytelling Section */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-extralight tracking-tight mb-8">
                Craftsmanship That Transcends Time
              </h2>
              <p className="text-xl leading-relaxed mb-8">
                Every frame tells a story of meticulous attention to detail, premium materials, 
                and innovative design. Our artisans blend traditional techniques with modern 
                innovation to create eyewear that defines luxury.
              </p>
              <Link
                to="/story"
                className="inline-flex items-center gap-3 text-lg font-medium hover:text-white transition-colors"
              >
                Our Story
                <ChevronRight className="h-5 w-5" />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop"
                alt="Craftsmanship"
                className="rounded-2xl"
              />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-4xl font-extralight">60+</span>
                <span className="text-sm ml-2">Years<br/>Heritage</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Support Widget */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="rounded-full text-black p-4 shadow-2xl transition-transform hover:scale-105">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
      </div>
    </>
  );
}



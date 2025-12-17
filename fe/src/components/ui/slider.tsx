import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

import { cn } from '@/lib/utils';

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  direction?: 'left' | 'right';
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, direction = 'right', ...props }, ref) => {
  const rangeRef = React.useRef<HTMLDivElement>(null);
  const [rangeWidth, setRangeWidth] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const clipId = React.useId();

  // Calculate wave offset and rotation based on slider value
  const value = props.value?.[0] ?? props.defaultValue?.[0] ?? 0;
  const max = props.max ?? 100;
  const min = props.min ?? 0;
  const normalizedValue = (value - min) / (max - min);
  const wavePhase = normalizedValue * Math.PI * 5; // 5 waves across the slider
  const waveOffset = isDragging ? Math.sin(wavePhase) * 30 : 0; // 30px amplitude only when dragging
  // Use derivative of sin (cos) to get the slope direction for rotation
  const waveRotation = isDragging ? -Math.cos(wavePhase) * 25 : 0; // negative to match wave direction, 25 degree max rotation

  React.useEffect(() => {
    const updateRangeWidth = () => {
      if (rangeRef.current) {
        const width = rangeRef.current.offsetWidth;
        const parentWidth = rangeRef.current.parentElement?.offsetWidth || 1;
        setRangeWidth((width / parentWidth) * 100);
      }
    };

    updateRangeWidth();
    const observer = new MutationObserver(updateRangeWidth);
    if (rangeRef.current?.parentElement) {
      observer.observe(rangeRef.current.parentElement, {
        attributes: true,
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, [props.value]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-8 w-full grow overflow-visible">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
        >
          {/* Gray background wave */}
          <path
            d="M 0,5 Q 5,2 10,5 T 20,5 T 30,5 T 40,5 T 50,5 T 60,5 T 70,5 T 80,5 T 90,5 T 100,5"
            fill="none"
            stroke="hsl(var(--mocha))"
            strokeWidth="2"
            strokeOpacity="0.2"
          />
          {/* Beige filled wave - clipped to range width */}
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={rangeWidth} height="10" />
            </clipPath>
          </defs>
          <path
            d="M 0,5 Q 5,2 10,5 T 20,5 T 30,5 T 40,5 T 50,5 T 60,5 T 70,5 T 80,5 T 90,5 T 100,5"
            fill="none"
            stroke="hsl(var(--mocha))"
            strokeWidth="2"
            clipPath={`url(#${clipId})`}
          />
        </svg>
        <SliderPrimitive.Range
          ref={rangeRef}
          className="absolute inset-0"
          style={{ background: 'transparent' }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="relative block h-20 w-20 cursor-grab active:cursor-grabbing focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 transition-all duration-200 hover:scale-110 active:scale-95 z-10 animate-wave"
        style={{
          transform: `translateY(${waveOffset}px) rotate(${waveRotation}deg)`,
          animation: isDragging ? 'none' : undefined,
        }}
        onPointerDown={() => setIsDragging(true)}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => setIsDragging(false)}
      >
        <img
          src="/logo.png"
          alt="slider"
          className="w-full h-full object-contain drop-shadow-lg transition-transform duration-300 ease-out"
          style={{
            transform: `scaleX(${direction === 'right' ? -1 : 1})`,
          }}
        />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

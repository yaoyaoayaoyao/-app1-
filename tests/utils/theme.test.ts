import { colors, gradients } from '@/theme';

describe('Theme Colors', () => {
  it('should have sky blue as primary color', () => {
    expect(colors.primary).toBe('#7EC8E3');
  });

  it('should have soft cloud white background', () => {
    expect(colors.background).toBe('#F7FBFE');
  });

  it('should define warm accent for check-in success', () => {
    expect(colors.accentWarm).toBe('#FFB5C5');
  });

  it('should have gradient definitions', () => {
    expect(gradients.sky).toEqual(['#E8F4FD', '#B8E0F5']);
  });
});

import { Request, Response } from 'express';
import Settings from '../../db/models/Settings';

export interface HeroBannerData {
  desktopImageUrl: string;
  mobileImageUrl: string;
  linkUrl?: string;
  altText?: string;
  isActive: boolean;
}

// Get Hero Banner (Public & Admin)
export const getHeroBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const setting = await Settings.findOne({ key: 'banner.hero' });

    if (!setting) {
      res.status(200).json({
        desktopImageUrl: '',
        mobileImageUrl: '',
        linkUrl: '',
        altText: 'Dayaram Sweets Hero Banner',
        isActive: true,
      });
      return;
    }

    const value = setting.value || {};
    res.status(200).json({
      desktopImageUrl: value.desktopImageUrl || '',
      mobileImageUrl: value.mobileImageUrl || '',
      linkUrl: value.linkUrl || '',
      altText: value.altText || 'Dayaram Sweets Hero Banner',
      isActive: setting.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching hero banner', error });
  }
};

// Update Hero Banner (Admin Only)
export const updateHeroBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { desktopImageUrl, mobileImageUrl, linkUrl, altText, isActive } = req.body;

    const trimmedDesktop = (desktopImageUrl || '').trim();
    const trimmedMobile = (mobileImageUrl || '').trim();

    // If one image is provided or banner is enabled with partial images, both are required
    if ((trimmedDesktop && !trimmedMobile) || (!trimmedDesktop && trimmedMobile)) {
      res.status(400).json({
        message: 'Both desktop and mobile banner images are required when configuring a banner.',
      });
      return;
    }

    const bannerValue = {
      desktopImageUrl: trimmedDesktop,
      mobileImageUrl: trimmedMobile,
      linkUrl: linkUrl || '',
      altText: altText || 'Dayaram Sweets Hero Banner',
    };

    const setting = await Settings.findOneAndUpdate(
      { key: 'banner.hero' },
      {
        $set: {
          value: bannerValue,
          type: 'object',
          category: 'general',
          description: 'Hero section responsive banners (desktop & mobile)',
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Hero banner updated successfully',
      banner: {
        ...setting.value,
        isActive: setting.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating hero banner', error });
  }
};

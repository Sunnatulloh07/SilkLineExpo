/**
 * Countries API Routes
 * Provides country data for forms and dropdowns
 * Senior Software Engineer Level Implementation
 */

const express = require('express');
const router = express.Router();

/**
 * Get all countries
 * GET /api/countries
 */
router.get('/', async (req, res) => {
    try {
        // Mock countries data - replace with database or external API when needed
        const countries = [
            {
                code: 'UZ',
                name: 'O\'zbekiston',
                nameEn: 'Uzbekistan',
                currency: 'UZS',
                phoneCode: '+998',
                flag: '🇺🇿'
            },
            {
                code: 'US',
                name: 'Amerika Qo\'shma Shtatlari',
                nameEn: 'United States',
                currency: 'USD',
                phoneCode: '+1',
                flag: '🇺🇸'
            },
            {
                code: 'RU',
                name: 'Rossiya',
                nameEn: 'Russia',
                currency: 'RUB',
                phoneCode: '+7',
                flag: '🇷🇺'
            },
            {
                code: 'CN',
                name: 'Xitoy',
                nameEn: 'China',
                currency: 'CNY',
                phoneCode: '+86',
                flag: '🇨🇳'
            },
            {
                code: 'DE',
                name: 'Germaniya',
                nameEn: 'Germany',
                currency: 'EUR',
                phoneCode: '+49',
                flag: '🇩🇪'
            },
            {
                code: 'TR',
                name: 'Turkiya',
                nameEn: 'Turkey',
                currency: 'TRY',
                phoneCode: '+90',
                flag: '🇹🇷'
            },
            {
                code: 'KZ',
                name: 'Qozog\'iston',
                nameEn: 'Kazakhstan',
                currency: 'KZT',
                phoneCode: '+7',
                flag: '🇰🇿'
            },
            {
                code: 'KG',
                name: 'Qirg\'iziston',
                nameEn: 'Kyrgyzstan',
                currency: 'KGS',
                phoneCode: '+996',
                flag: '🇰🇬'
            },
            {
                code: 'TJ',
                name: 'Tojikiston',
                nameEn: 'Tajikistan',
                currency: 'TJS',
                phoneCode: '+992',
                flag: '🇹🇯'
            },
            {
                code: 'TM',
                name: 'Turkmaniston',
                nameEn: 'Turkmenistan',
                currency: 'TMT',
                phoneCode: '+993',
                flag: '🇹🇲'
            },
            {
                code: 'AF',
                name: 'Afg\'oniston',
                nameEn: 'Afghanistan',
                currency: 'AFN',
                phoneCode: '+93',
                flag: '🇦🇫'
            },
            {
                code: 'AE',
                name: 'Birlashgan Arab Amirliklari',
                nameEn: 'United Arab Emirates',
                currency: 'AED',
                phoneCode: '+971',
                flag: '🇦🇪'
            },
            {
                code: 'IN',
                name: 'Hindiston',
                nameEn: 'India',
                currency: 'INR',
                phoneCode: '+91',
                flag: '🇮🇳'
            },
            {
                code: 'GB',
                name: 'Buyuk Britaniya',
                nameEn: 'United Kingdom',
                currency: 'GBP',
                phoneCode: '+44',
                flag: '🇬🇧'
            },
            {
                code: 'FR',
                name: 'Fransiya',
                nameEn: 'France',
                currency: 'EUR',
                phoneCode: '+33',
                flag: '🇫🇷'
            }
        ];


        res.json({
            success: true,
            countries,
            total: countries.length,
            message: 'Countries retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error getting countries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve countries',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * Get country by code
 * GET /api/countries/:code
 */
router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        // This is a simplified lookup - in real app, use database
        const countriesData = {
            'UZ': {
                code: 'UZ',
                name: 'O\'zbekiston',
                nameEn: 'Uzbekistan',
                currency: 'UZS',
                phoneCode: '+998',
                flag: '🇺🇿'
            },
            'US': {
                code: 'US',
                name: 'Amerika Qo\'shma Shtatlari',
                nameEn: 'United States',
                currency: 'USD',
                phoneCode: '+1',
                flag: '🇺🇸'
            }
            // Add more as needed
        };

        const country = countriesData[code.toUpperCase()];
        
        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        res.json({
            success: true,
            country,
            message: 'Country retrieved successfully'
        });

    } catch (error) {
        console.error('❌ Error getting country by code:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve country',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;

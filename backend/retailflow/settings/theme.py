"""django-unfold theme configuration for the Django admin."""

UNFOLD = {
    'SITE_TITLE':     'RetailFlow',
    'SITE_HEADER':    'RetailFlow',
    'SITE_SUBHEADER': 'Admin',
    'SITE_URL':       '/',
    'SITE_SYMBOL':    'inventory_2',  # Material Symbols icon
    'SHOW_HISTORY':         True,
    'SHOW_VIEW_ON_SITE':    True,
    'SHOW_BACK_BUTTON':     True,
    'THEME': None,  # None = follow OS; 'dark' or 'light' to force
    'LOGIN': {
        'image': None,
    },
    'BORDER_RADIUS': '8px',
    'COLORS': {
        'base': {
            '50':  '249 250 251',
            '100': '243 244 246',
            '200': '229 231 235',
            '300': '209 213 219',
            '400': '156 163 175',
            '500': '107 114 128',
            '600': '75 85 99',
            '700': '55 65 81',
            '800': '31 41 55',
            '900': '17 24 39',
            '950': '3 7 18',
        },
        'primary': {
            '50':  '240 253 244',
            '100': '220 252 231',
            '200': '187 247 208',
            '300': '134 239 172',
            '400': '74 222 128',
            '500': '34 197 94',
            '600': '22 163 74',
            '700': '21 128 61',
            '800': '22 101 52',
            '900': '20 83 45',
            '950': '5 46 22',
        },
        'font': {
            'subtle-light':   'var(--color-base-500)',
            'subtle-dark':    'var(--color-base-400)',
            'default-light':  'var(--color-base-600)',
            'default-dark':   'var(--color-base-300)',
            'important-light': 'var(--color-base-900)',
            'important-dark':  'var(--color-base-100)',
        },
    },
    'SIDEBAR': {
        'show_search': True,
        'show_all_applications': True,
    },
    'TABS': [],
}

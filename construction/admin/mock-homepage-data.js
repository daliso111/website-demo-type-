export const homepageMockData = {
  meta: {
    version: 1,
    lastSaved: '2026-07-11T09:30:00.000Z',
    lastPublished: '2026-07-10T14:15:00.000Z'
  },
  hero: {
    id: 'hero',
    heading: 'Building Lasting Value',
    backgroundVideoAssetId: '',
    posterAssetId: '',
    posterAltText: '',
    loopEnabled: true,
    mobileVideoEnabled: true,
    playbackRate: 1,
    isVisible: true,
    status: 'draft',
    updatedAt: '2026-07-11T08:45:00.000Z'
  },
  discoveryBridge: {
    id: 'discovery',
    paragraph: 'Hilltop Construction approaches every project with a commitment to quality, safety, and lasting value. From planning to delivery, we build with precision, reliability, and purpose.',
    buttonLabel: 'Learn more',
    buttonUrl: '#about',
    alignment: 'center',
    visible: true,
    status: 'published',
    updatedAt: '2026-07-09T11:20:00.000Z'
  },
  featuredProjects: [
    { id: 'project-1', title: 'Explore Our Work', description: 'From residential buildings to commercial developments and civil works, Hilltop Construction delivers construction projects with a focus on quality, safety, and lasting value.', image: '../assets/expertise-building.png', imageAlt: 'Commercial building under construction', buttonLabel: 'Discover our projects', buttonUrl: '#projects', layout: 'image-left', order: 1, visible: true, status: 'published', updatedAt: '2026-07-10T10:30:00.000Z' },
    { id: 'project-2', title: 'Commercial Developments', description: 'Hilltop Construction supports commercial construction projects with careful planning, reliable coordination, and a focus on long-term value.', image: '../assets/expertise-renovations.png', imageAlt: 'Contemporary commercial development', buttonLabel: 'View commercial work', buttonUrl: '#projects', layout: 'image-right', order: 2, visible: true, status: 'draft', updatedAt: '2026-07-11T07:15:00.000Z' },
    { id: 'project-3', title: 'Civil Works', description: 'From site preparation to infrastructure improvements, Hilltop Construction delivers practical construction solutions with safety, quality, and precision.', image: '../assets/expertise-civil.png', imageAlt: 'Road and drainage civil works', buttonLabel: 'View civil projects', buttonUrl: '#projects', layout: 'image-left', order: 3, visible: true, status: 'published', updatedAt: '2026-07-08T16:00:00.000Z' }
  ],
  expertiseSlides: [
    { id: 'expertise-1', title: 'Building Construction', description: 'From foundations to finishes, Hilltop Construction delivers reliable building construction with careful planning, skilled coordination, and a focus on long-term value.', image: '../assets/expertise-building.png', imageAlt: 'Commercial building structure under construction', focalX: 50, focalY: 50, buttonLabel: 'Explore building work', buttonUrl: '#projects', order: 1, visible: true, status: 'published', updatedAt: '2026-07-10T13:00:00.000Z' },
    { id: 'expertise-2', title: 'Renovations & Extensions', description: 'We upgrade and extend existing spaces with practical solutions, safe execution, and attention to detail.', image: '../assets/expertise-renovations.png', imageAlt: 'Contemporary extension added to an existing building', focalX: 46, focalY: 48, buttonLabel: 'Explore renovations', buttonUrl: '#projects', order: 2, visible: true, status: 'published', updatedAt: '2026-07-10T13:05:00.000Z' },
    { id: 'expertise-3', title: 'Civil Works', description: 'From site preparation to roadworks and drainage, Hilltop Construction delivers civil works with durability and regulatory care.', image: '../assets/expertise-civil.png', imageAlt: 'Road and drainage civil works in progress', focalX: 52, focalY: 52, buttonLabel: 'Explore civil works', buttonUrl: '#projects', order: 3, visible: true, status: 'draft', updatedAt: '2026-07-11T09:00:00.000Z' },
    { id: 'expertise-4', title: 'Project Management', description: 'We manage timelines, budgets, teams, and subcontractors with clear communication from planning through completion.', image: '../assets/expertise-management.png', imageAlt: 'Project management team reviewing construction plans', focalX: 50, focalY: 44, buttonLabel: 'Explore management', buttonUrl: '#projects', order: 4, visible: true, status: 'published', updatedAt: '2026-07-09T15:30:00.000Z' }
  ],
  businessSnapshot: {
    settings: {
      eyebrow: 'Hilltop Construction at a glance',
      heading: 'A snapshot of Hilltop Construction',
      introduction: 'Practical experience, trusted partnerships, and disciplined project delivery shape the way we build.',
      visible: true,
      status: 'draft',
      videoEnabled: true,
      backgroundVideoAssetId: '',
      posterAssetId: '',
      overlayOpacity: 0.72,
      playbackRate: 0.75,
      loopEnabled: true,
      mobileVideoEnabled: false,
      reducedMotionFallback: 'poster',
      updatedAt: '2026-07-11T09:20:00.000Z'
    },
    statistics: [
      { id: 'stat-1', value: '[XX]', prefix: '', suffix: '+', description: 'Years of combined construction experience', order: 1, visible: true, status: 'draft' },
      { id: 'stat-2', value: '[XXX]', prefix: '', suffix: '+', description: 'Projects successfully delivered', order: 2, visible: true, status: 'draft' },
      { id: 'stat-3', value: '[XX]', prefix: '', suffix: '', description: 'Skilled team members and trusted specialists', order: 3, visible: true, status: 'draft' },
      { id: 'stat-4', value: '[XX]', prefix: '', suffix: '%', description: 'Projects delivered within agreed schedules', order: 4, visible: true, status: 'draft' }
    ]
  },
  newsArticles: [
    { id: '737f1a08-fec2-48e6-9812-b2aa3d6ef55a', articleKey: '737f1a08-fec2-48e6-9812-b2aa3d6ef55a', category: 'Project Planning', title: 'Planning for the Rainy Season on Active Sites', summary: 'How Hilltop Construction adjusts scheduling, site access, and construction planning to keep projects moving safely through the wet season.', publicationDate: '2026-06-18', image: '../assets/expertise-civil.png', imageAlt: 'Active construction site prepared for wet weather', articleUrl: '#news', featured: true, order: 1, visible: true, status: 'published', updatedAt: '2026-07-08T12:00:00.000Z' },
    { id: 'dc8b1332-e363-4d95-8d22-85bbc27afc0c', articleKey: 'dc8b1332-e363-4d95-8d22-85bbc27afc0c', category: 'Materials & Quality', title: 'Choosing Materials That Last', summary: 'A practical look at how early material decisions improve durability, maintenance performance, and long-term project value.', publicationDate: '2026-05-22', image: '../assets/expertise-building.png', imageAlt: 'Durable construction materials on an active site', articleUrl: '#news', featured: false, order: 2, visible: true, status: 'draft', updatedAt: '2026-07-11T08:10:00.000Z' },
    { id: '9a83bc97-1412-4b6f-8c6b-67caa6b3e9e8', articleKey: '9a83bc97-1412-4b6f-8c6b-67caa6b3e9e8', category: 'Project Management', title: 'Why Project Management Matters on Site', summary: 'Strong coordination between teams, schedules, budgets, and subcontractors helps construction projects remain efficient and predictable.', publicationDate: '2026-04-14', image: '../assets/expertise-management.png', imageAlt: 'Construction managers coordinating work on site', articleUrl: '#news', featured: false, order: 3, visible: true, status: 'published', updatedAt: '2026-07-07T09:45:00.000Z' }
  ],
  mediaAssets: [
    { id: 'media-1', filename: 'hero-construction.jpg', path: '../assets/hero-construction.jpg', type: 'image', group: 'Hero', size: '1.8 MB', dimensions: '1920 × 1080', duration: '', altText: 'Hilltop Construction project at sunset', uploadedAt: '2026-06-01', usedBy: ['Hero'] },
    { id: 'media-2', filename: 'expertise-building.png', path: '../assets/expertise-building.png', type: 'image', group: 'Expertise', size: '1.2 MB', dimensions: '1600 × 1000', duration: '', altText: 'Commercial building structure under construction', uploadedAt: '2026-06-04', usedBy: ['Featured Projects', 'Expertise', 'News'] },
    { id: 'media-3', filename: 'expertise-renovations.png', path: '../assets/expertise-renovations.png', type: 'image', group: 'Expertise', size: '1.1 MB', dimensions: '1600 × 1000', duration: '', altText: 'Contemporary building extension', uploadedAt: '2026-06-04', usedBy: ['Featured Projects', 'Expertise'] },
    { id: 'media-4', filename: 'expertise-civil.png', path: '../assets/expertise-civil.png', type: 'image', group: 'Expertise', size: '1.3 MB', dimensions: '1600 × 1000', duration: '', altText: 'Road and drainage works in progress', uploadedAt: '2026-06-04', usedBy: ['Featured Projects', 'Expertise', 'News'] },
    { id: 'media-5', filename: 'expertise-management.png', path: '../assets/expertise-management.png', type: 'image', group: 'Expertise', size: '1.0 MB', dimensions: '1600 × 1000', duration: '', altText: 'Project team reviewing plans', uploadedAt: '2026-06-04', usedBy: ['Expertise', 'News'] },
    { id: 'media-6', filename: 'snapshot-texture-preview.mp4', path: 'media/snapshot-texture-preview.mp4', type: 'video', group: 'Business Snapshot', size: '4.6 MB', dimensions: '1280 × 720', duration: '00:18', altText: '', uploadedAt: '2026-07-08', usedBy: ['Business Snapshot'] },
    { id: 'media-7', filename: 'project-placeholder.jpg', path: '', type: 'image', group: 'Featured Projects', size: '860 KB', dimensions: '1400 × 1050', duration: '', altText: '', uploadedAt: '2026-07-10', usedBy: [] }
  ],
  homepageSections: [
    { id: 'hero', label: 'Hero', order: 1, visible: true, status: 'published' },
    { id: 'discovery', label: 'Discovery Bridge', order: 2, visible: true, status: 'published' },
    { id: 'projects', label: 'Featured Projects', order: 3, visible: true, status: 'published' },
    { id: 'expertise', label: 'Expertise', order: 4, visible: true, status: 'published' },
    { id: 'logos', label: 'Logo Bridge', order: 5, visible: true, status: 'draft' },
    { id: 'snapshot', label: 'Business Snapshot', order: 6, visible: true, status: 'draft' },
    { id: 'news', label: 'News & Foresight', order: 7, visible: true, status: 'published' }
  ],
  homepageSettings: {
    projectViewAllLabel: 'View all',
    projectViewAllUrl: '#projects',
    newsViewAllLabel: 'View all news',
    newsViewAllUrl: '#news',
    sharedLearnMoreLabel: 'Learn more',
    reducedMotionDefault: true,
    autoplayPreviews: false,
    defaultImageFallback: '../assets/hero-construction.jpg',
    altTextWarnings: true
  }
};

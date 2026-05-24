(function () {
  "use strict";

  window.DEFAULT_SITE_DATA = {
    settings: {
      siteName: "",
      brandName: "",
      brandSlogan: "موقع شخصي",
      brandLogo: "",
      language: "ar",
      direction: "rtl",
      theme: "light",
      phoneNumber: "",
      email: ""
    },
    navigation: {
      homeLabel: "الرئيسية",
      projectsLabel: "مشاريعنا",
      pagesLabel: "الصفحات",
      adminLabel: "الإدارة"
    },
    home: {
      ownerName: "",
      title: "",
      intro: "",
      avatar: "",
      biography: "",
      heroTitle: "",
      heroSubtitle: "",
      heroIntro: "",
      heroImage: "",
      heroVideo: "",
      heroSlides: [],
      experience: [],
      achievements: [],
      skills: [],
      contacts: []
    },
    projects: [],
    pages: []
  };

  window.CONTACT_ICON_OPTIONS = [
    { value: "linkedin", label: "LinkedIn" },
    { value: "github", label: "GitHub" },
    { value: "x", label: "X / Twitter" },
    { value: "email", label: "Email" },
    { value: "website", label: "Website" },
    { value: "phone", label: "Phone" }
  ];

  window.PAGE_CONTENT_MODES = [
    { value: "text", label: "نص عادي" },
    { value: "html", label: "HTML منسق" }
  ];

  window.ADMIN_AUTH_CONFIG = {
    sessionKey: "websiteDemo:adminSession"
  };
})();

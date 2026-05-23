(function () {
  "use strict";

  window.DEFAULT_SITE_DATA = {
    settings: {
      siteName: "",
      language: "ar",
      direction: "rtl",
      theme: "light"
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

  /*
   * This local passcode is only for local testing. For production, replace this
   * with real authentication such as Supabase Auth.
   */
  window.ADMIN_AUTH_CONFIG = {
    email: "admin@gmail.com",
    passcode: "1234",
    sessionKey: "websiteDemo:adminSession"
  };
})();

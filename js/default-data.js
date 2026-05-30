(function () {
  "use strict";

  window.DEFAULT_SITE_DATA = {
    settings: {
      siteName: "",
      brandName: "",
      brandSlogan: "موقع شخصي",
      brandLogo: "",
      siteIcon: "",
      language: "ar",
      direction: "rtl",
      theme: "light",
      phoneNumber: "",
      email: "",
      shellTopbarText: "موقع شخصي قابل للإدارة عبر نظام محتوى محلي.",
      shellTopbarShortText: "موقع شخصي قابل للإدارة.",
      shellVerifyLabel: "كيف تتحقق؟",
      shellVerifyTitle: "تحقق من رابط الموقع قبل إدخال أي بيانات.",
      shellVerifyDescription: "استخدم الرابط الرسمي الذي يقدمه مالك الموقع، وتجنب الروابط المختصرة أو غير المعروفة.",
      shellSecurityTitle: "الاتصال الآمن يستخدم بروتوكول HTTPS.",
      shellSecurityDescription: "تأكد من ظهور القفل في المتصفح عند استخدام نسخة منشورة على الاستضافة.",
      shellNoticeText: "هذا موقع شخصي مستقل وغير تابع لأي جهة حكومية."
    },
    navigation: {
      homeLabel: "الرئيسية",
      projectsLabel: "مشاريعنا",
      pagesLabel: "الصفحات",
      adminLabel: "الإدارة"
    },
    texts: {
      searchLabel: "بحث",
      searchPlaceholder: "البحث في الموقع...",
      loginLabel: "تسجيل الدخول",
      logoutLabel: "تسجيل الخروج",
      adminPortalLabel: "الإدارة",
      themeToggleLabel: "تبديل الوضع الليلي",
      changePasswordLabel: "تغيير كلمة المرور",
      changeEmailLabel: "تغيير البريد الإلكتروني",
      changePhoneLabel: "تغيير رقم الجوال",
      sharePageLabel: "مشاركة الصفحة",
      footerLinksHeading: "روابط سريعة",
      footerSocialHeading: "وسائل التواصل",
      footerSocialEmpty: "لم تتم إضافة وسائل تواصل بعد",
      footerVersion: "Biography v1.0",
      footerDisclaimer: "تنويه: هذا الموقع شخصي وغير تابع لأي جهة حكومية، ولا يمثل إلا وجهة نظر صاحبه.",
      homeEmptyTitle: "لم تتم إضافة محتوى بعد",
      homeEmptyDescription: "يمكنك إضافة المحتوى من لوحة الإدارة.",
      homeEmptyButton: "فتح لوحة الإدارة",
      adminHomePanelTitle: "محتوى الصفحة الرئيسية",
      adminHomePanelDescription: "كل الحقول اختيارية، ولن يظهر المحتوى العام إلا بعد حفظ بياناتك.",
      adminHomeSaveButton: "حفظ الرئيسية",
      biographySubtitle: "السيرة الذاتية",
      biographyTitle: "نبذة مختصرة",
      professionalSubtitle: "المحتوى المهني",
      professionalTitle: "الخبرات والإنجازات",
      experienceHeading: "الخبرات",
      achievementsHeading: "الإنجازات",
      skillsSubtitle: "المهارات",
      skillsTitle: "مجالات الخبرة",
      skillsEmptyTitle: "لم تتم إضافة مجالات خبرة بعد",
      skillsEmptyDescription: "يمكن إضافة المهارات من لوحة الإدارة.",
      homeListEmptyPrefix: "لم تتم إضافة ",
      homeListEmptySuffix: " بعد",
      homeListEmptyDescription: "يمكن إضافة العناصر من لوحة الإدارة.",
      projectsDescription: "تظهر المشاريع هنا بعد إضافتها من لوحة الإدارة، وتبقى منظمة حتى عند زيادة العدد.",
      projectsEmptyTitle: "لم تتم إضافة مشاريع بعد",
      projectsEmptyDescription: "يمكنك إضافة المشاريع من لوحة الإدارة.",
      projectsEmptyButton: "إضافة مشروع",
      projectsListSubtitle: "قائمة المشاريع",
      projectsListTitle: "الأعمال المضافة",
      projectDetailsButton: "تفاصيل المشروع",
      projectFilterAll: "الكل",
      projectFilterGeneral: "عام",
      projectNotFoundTitle: "المشروع غير موجود",
      projectNotFoundEmptyTitle: "لم يتم العثور على المشروع المطلوب",
      projectNotFoundEmptyDescription: "يمكنك العودة إلى صفحة مشاريعنا واختيار مشروع آخر.",
      projectDetailFallbackTitle: "تفاصيل المشروع",
      projectFactStatus: "الحالة",
      projectFactDate: "التاريخ",
      projectFactCategory: "التصنيف",
      projectBackButton: "العودة للمشاريع",
      projectVisitButton: "زيارة رابط المشروع",
      pagesDescription: "كل صفحة تضيفها من لوحة الإدارة تظهر هنا كبطاقة مستقلة ومنظمة.",
      pagesEmptyTitle: "لم تتم إضافة صفحات بعد",
      pagesEmptyDescription: "يمكنك إضافة الصفحات من لوحة الإدارة.",
      pagesEmptyButton: "إضافة صفحة",
      pagesListSubtitle: "قائمة الصفحات",
      pagesListTitle: "الصفحات المضافة",
      pageCardFallbackTitle: "صفحة",
      pageOpenButton: "فتح الصفحة",
      extraPageNotFoundTitle: "لم يتم العثور على الصفحة المطلوبة",
      extraPageNotFoundDescription: "يمكنك العودة إلى الصفحة الرئيسية أو إنشاء الصفحة من لوحة الإدارة.",
      extraPageEmptyTitle: "لم تتم إضافة محتوى لهذه الصفحة بعد",
      extraPageEmptyDescription: "يمكن تعديل هذه الصفحة من لوحة الإدارة.",
      notificationsLabel: "الإشعارات",
      notificationsDescription: "كل التحديثات التي تمت من لوحة الإدارة تظهر هنا.",
      notificationsEmptyTitle: "لا توجد إشعارات بعد",
      notificationsEmptyDescription: "ستظهر هنا تحديثات الصفحة الرئيسية والمشاريع والصفحات بعد حفظها من لوحة الإدارة.",
      notificationsViewAllLabel: "عرض كل الإشعارات",
      notificationReadLabel: "مقروء",
      notificationMarkReadLabel: "تحديد كمقروء",
      notificationViewLabel: "عرض",
      notificationDeleteLabel: "حذف"
    },
    home: {
      ownerName: "",
      title: "",
      intro: "",
      avatar: "",
      biography: "",
      heroImage: "",
      heroVideo: "",
      heroSlides: [],
      experience: [],
      achievements: [],
      skills: [],
      contacts: [],
      footerLinks: []
    },
    footer: {
      columns: [
        {
          id: "footer-column-quick",
          title: "روابط سريعة",
          visible: true,
          links: []
        }
      ],
      iconGroups: [
        {
          id: "footer-icons-social",
          title: "تابعنا",
          visible: true,
          links: []
        },
        {
          id: "footer-icons-app",
          title: "تطبيق الجوال",
          visible: true,
          links: []
        }
      ],
      bottomLinks: [],
      logos: [],
      copyrightText: "",
      legalText: ""
    },
    projects: [],
    pages: [],
    integrations: [],
    notifications: []
  };

  window.CONTACT_ICON_OPTIONS = [
    { value: "linkedin", label: "LinkedIn" },
    { value: "facebook", label: "Facebook" },
    { value: "instagram", label: "Instagram" },
    { value: "youtube", label: "YouTube" },
    { value: "github", label: "GitHub" },
    { value: "x", label: "X / Twitter" },
    { value: "email", label: "Email" },
    { value: "website", label: "Website" },
    { value: "phone", label: "Phone" },
    { value: "location", label: "Location" },
    { value: "appstore", label: "Apple App Store" },
    { value: "googleplay", label: "Android / Google Play" },
    { value: "huawei", label: "Huawei AppGallery" }
  ];

  window.PAGE_CONTENT_MODES = [
    { value: "text", label: "نص عادي" },
    { value: "html", label: "HTML منسق" }
  ];

  window.INTEGRATION_TYPES = [
    { value: "payment", label: "دفع" },
    { value: "analytics", label: "تحليلات" },
    { value: "api", label: "واجهة برمجية" },
    { value: "chat", label: "محادثة" },
    { value: "email", label: "بريد" },
    { value: "custom", label: "مخصص" }
  ];

  window.INTEGRATION_ENVIRONMENTS = [
    { value: "test", label: "تجريبي" },
    { value: "live", label: "فعلي" },
    { value: "sandbox", label: "Sandbox" }
  ];

  window.ADMIN_AUTH_CONFIG = {
    sessionKey: "websiteDemo:adminSession"
  };
})();

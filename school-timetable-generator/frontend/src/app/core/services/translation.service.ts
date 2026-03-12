import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'en' | 'fr' | 'ar';

const LANG_KEY = 'app_language';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'create': 'Create',
    'update': 'Update',
    'search': 'Search',
    'actions': 'Actions',
    'loading': 'Loading...',
    'no_results': 'No results found',

    // Auth
    'welcome_back': 'Welcome Back',
    'sign_in': 'Sign In',
    'sign_in_subtitle': 'Sign in to your account to continue',
    'email': 'Email Address',
    'password': 'Password',
    'signing_in': 'Signing in...',
    'contact_admin': 'Contact your administrator if you need an account',

    // Sidebar
    'main_menu': 'MAIN MENU',
    'account': 'ACCOUNT',
    'my_profile': 'My Profile',
    'sign_out': 'Sign Out',

    // Dashboard
    'dashboard': 'Dashboard',
    'platform_overview': 'Platform overview and quick actions',
    'welcome_back_name': 'Welcome back',
    'schools': 'Schools',
    'administrators': 'Administrators',
    'total_users': 'Total Users',
    'add_school': 'Add School',
    'add_admin': 'Add Admin',
    'quick_actions': 'Quick Actions',
    'manage_schools': 'Manage Schools',
    'manage_admins': 'Manage Admins',
    'add_edit_schools': 'Add, edit, or deactivate schools',
    'assign_admins': 'Assign admins to schools',

    // Schools
    'manage_all_schools': 'Manage all schools on the platform',
    'school_name': 'School Name',
    'address': 'Address',
    'phone': 'Phone',
    'status': 'Status',
    'active': 'Active',
    'inactive': 'Inactive',
    'all_status': 'All Status',
    'statistics': 'Statistics',

    // Admins
    'manage_admin_accounts': 'Manage admin accounts across schools',
    'admin': 'Admin',
    'school': 'School',
    'add_new_admin': 'Add New Admin',
    'first_name': 'First Name',
    'last_name': 'Last Name',
    'assign_to_school': 'Assign to School',
    'no_school_assigned': 'No school assigned',
    'creating': 'Creating...',
    'create_admin': 'Create Admin',
    'remove_admin': 'Remove Admin',
    'change_password': 'Change Password',
    'new_password': 'New Password',
    'confirm_password': 'Confirm Password',
    'passwords_no_match': 'Passwords do not match',
    'changing': 'Changing...',

    // Teachers
    'teachers': 'Teachers',
    'manage_teachers': 'Manage teaching staff and subject assignments',
    'add_teacher': 'Add Teacher',
    'teacher': 'Teacher',
    'max_hours': 'Max Hours',
    'subjects': 'Subjects',

    // Classes
    'classes': 'Classes',
    'manage_classes': 'Manage class groups and student counts',
    'add_class': 'Add Class',
    'name': 'Name',
    'level': 'Level',
    'students': 'Students',
    'select_level': 'Select level',
    'number_of_students': 'Number of Students',

    // Subjects
    'manage_subjects': 'Manage curriculum subjects and scheduling parameters',
    'add_subject': 'Add Subject',
    'hours_week': 'Hours/Week',
    'session_duration': 'Session Duration',

    // Rooms
    'rooms': 'Rooms',
    'timetable': 'Timetable',

    // Profile
    'manage_account': 'Manage your account information',
    'profile_information': 'Profile Information',
    'current_password': 'Current Password',
    'confirm_new_password': 'Confirm New Password',
    'save_changes': 'Save Changes',
    'saving': 'Saving...',

    // Teacher
    'my_schedule': 'My Schedule',
    'availability': 'Availability',

    // Roles
    'super_admin': 'Super Admin',
    'administrator': 'Administrator',
    'role_teacher': 'Teacher',

    // Admin Dashboard
    'school_management_overview': 'School management overview',
    'generate_timetable': 'Generate Timetable',
    'manage_teaching_staff': 'Manage teaching staff',
    'manage_class_groups': 'Manage class groups',
    'manage_curriculum': 'Manage curriculum',
    'manage_classrooms': 'Manage classrooms',

    // Rooms
    'add_room': 'Add Room',
    'manage_rooms': 'Manage classrooms and their capacities',
    'capacity': 'Capacity',
    'type': 'Type',

    // Teacher Dashboard
    'teaching_overview': 'Your teaching overview at a glance',
    'weekly_lessons': 'Weekly Lessons',
    'view_schedule': 'View Schedule',
    'set_availability': 'Set Availability',
    'quick_links': 'Quick Links',

    // Teacher Schedule
    'weekly_timetable': 'Your weekly teaching timetable',
    'lessons_this_week': 'lessons this week',
    'no_lessons': 'No lessons',
    'no_schedule_yet': 'No Schedule Yet',
    'schedule_appear_msg': 'Your schedule will appear here once the timetable has been generated.',

    // Teacher Availability
    'my_availability': 'My Availability',
    'set_when_available': 'Set when you are available to teach',
    'save_availability': 'Save Availability',
    'check_timeslots': 'Check the timeslots when you are available to teach.',
    'no_timeslots': 'No Timeslots Configured',
    'contact_admin_timeslots': 'Please contact your administrator to set up timeslots.',

    // Timetable
    'generate_manage_schedules': 'Generate and manage optimized schedules',
    'solving': 'Solving...',
    'generate': 'Generate',
    'stop': 'Stop',
    'export': 'Export',
    'refresh': 'Refresh',
    'ai_solver_working': 'AI solver is working...',
    'view_by': 'View by:',
    'grid_view': 'Grid View',
    'card_view': 'Card View',
    'filter_class': 'Filter class:',
    'filter_teacher': 'Filter teacher:',
    'all_classes': 'All Classes',
    'all_teachers': 'All Teachers',
    'no_timetable_yet': 'No Timetable Yet',
    'click_generate_msg': 'Click "Generate" to start the AI solver and create an optimized schedule.',
    'lessons': 'lessons',
    'time': 'Time',

    // Search
    'search_classes': 'Search classes...',
    'search_subjects': 'Search subjects...',
    'search_rooms': 'Search rooms...',

    // Delete modals
    'delete_class': 'Delete Class',
    'delete_subject': 'Delete Subject',
    'delete_room': 'Delete Room',
    'this_cannot_be_undone': 'This cannot be undone.',

    // Room types
    'seats': 'seats',
    'general': 'General',
    'lecture_hall': 'Lecture Hall',
    'lab': 'Lab',
    'computer_lab': 'Computer Lab',
    'workshop': 'Workshop',
    'gymnasium': 'Gymnasium',
    'library': 'Library',

    // Teacher dashboard
    'welcome_back_msg_teacher': 'View your weekly schedule and manage your availability preferences.',

    // Level
    'level_n': 'Level',

    // Days
    'MONDAY': 'Monday',
    'TUESDAY': 'Tuesday',
    'WEDNESDAY': 'Wednesday',
    'THURSDAY': 'Thursday',
    'FRIDAY': 'Friday',
    'SATURDAY': 'Saturday',
    'SUNDAY': 'Sunday',

    // Timeslots
    'timeslots': 'Timeslots',
    'timeslot': 'timeslot',
    'manage_timeslots_desc': 'Configure class periods and scheduling slots',
    'add_timeslot': 'Add Timeslot',
    'add_new_timeslot': 'Add New Timeslot',
    'edit_timeslot': 'Edit Timeslot',
    'remove_timeslot': 'Remove Timeslot',
    'remove': 'Remove',
    'day': 'Day',
    'start_time': 'Start Time',
    'end_time': 'End Time',
    'order': 'Order',
    'order_in_day': 'Order in Day',
    'select_day': 'Select a day',
    'all_days': 'All Days',
    'no_timeslots_yet': 'No timeslots yet',
    'create_first_timeslot': 'Create your first timeslot to get started.',
    'try_different_filter': 'Try a different filter.',

    // Edit admin
    'edit_admin': 'Edit Admin'
  },
  fr: {
    'save': 'Enregistrer',
    'cancel': 'Annuler',
    'delete': 'Supprimer',
    'edit': 'Modifier',
    'create': 'Créer',
    'update': 'Mettre à jour',
    'search': 'Rechercher',
    'actions': 'Actions',
    'loading': 'Chargement...',
    'no_results': 'Aucun résultat trouvé',

    'welcome_back': 'Bon retour',
    'sign_in': 'Se connecter',
    'sign_in_subtitle': 'Connectez-vous à votre compte pour continuer',
    'email': 'Adresse email',
    'password': 'Mot de passe',
    'signing_in': 'Connexion en cours...',
    'contact_admin': 'Contactez votre administrateur si vous avez besoin d\'un compte',

    'main_menu': 'MENU PRINCIPAL',
    'account': 'COMPTE',
    'my_profile': 'Mon Profil',
    'sign_out': 'Déconnexion',

    'dashboard': 'Tableau de bord',
    'platform_overview': 'Aperçu de la plateforme et actions rapides',
    'welcome_back_name': 'Bienvenue',
    'schools': 'Écoles',
    'administrators': 'Administrateurs',
    'total_users': 'Utilisateurs totaux',
    'add_school': 'Ajouter une école',
    'add_admin': 'Ajouter un admin',
    'quick_actions': 'Actions rapides',
    'manage_schools': 'Gérer les écoles',
    'manage_admins': 'Gérer les admins',
    'add_edit_schools': 'Ajouter, modifier ou désactiver des écoles',
    'assign_admins': 'Affecter des admins aux écoles',

    'manage_all_schools': 'Gérer toutes les écoles de la plateforme',
    'school_name': 'Nom de l\'école',
    'address': 'Adresse',
    'phone': 'Téléphone',
    'status': 'Statut',
    'active': 'Actif',
    'inactive': 'Inactif',
    'all_status': 'Tous les statuts',
    'statistics': 'Statistiques',

    'manage_admin_accounts': 'Gérer les comptes admin des écoles',
    'admin': 'Admin',
    'school': 'École',
    'add_new_admin': 'Ajouter un nouvel admin',
    'first_name': 'Prénom',
    'last_name': 'Nom',
    'assign_to_school': 'Affecter à une école',
    'no_school_assigned': 'Aucune école affectée',
    'creating': 'Création...',
    'create_admin': 'Créer un admin',
    'remove_admin': 'Supprimer l\'admin',
    'change_password': 'Changer le mot de passe',
    'new_password': 'Nouveau mot de passe',
    'confirm_password': 'Confirmer le mot de passe',
    'passwords_no_match': 'Les mots de passe ne correspondent pas',
    'changing': 'Changement...',

    'teachers': 'Enseignants',
    'manage_teachers': 'Gérer le personnel enseignant et les affectations',
    'add_teacher': 'Ajouter un enseignant',
    'teacher': 'Enseignant',
    'max_hours': 'Heures max',
    'subjects': 'Matières',

    'classes': 'Classes',
    'manage_classes': 'Gérer les groupes de classes et les effectifs',
    'add_class': 'Ajouter une classe',
    'name': 'Nom',
    'level': 'Niveau',
    'students': 'Élèves',
    'select_level': 'Sélectionner le niveau',
    'number_of_students': 'Nombre d\'élèves',

    'manage_subjects': 'Gérer les matières et les paramètres de planification',
    'add_subject': 'Ajouter une matière',
    'hours_week': 'Heures/Semaine',
    'session_duration': 'Durée de séance',

    'rooms': 'Salles',
    'timetable': 'Emploi du temps',

    'manage_account': 'Gérer les informations de votre compte',
    'profile_information': 'Informations du profil',
    'current_password': 'Mot de passe actuel',
    'confirm_new_password': 'Confirmer le nouveau mot de passe',
    'save_changes': 'Enregistrer',
    'saving': 'Enregistrement...',

    'my_schedule': 'Mon emploi du temps',
    'availability': 'Disponibilité',

    'super_admin': 'Super Admin',
    'administrator': 'Administrateur',
    'role_teacher': 'Enseignant',

    'school_management_overview': 'Aperçu de la gestion scolaire',
    'generate_timetable': 'Générer l\'emploi du temps',
    'manage_teaching_staff': 'Gérer le personnel enseignant',
    'manage_class_groups': 'Gérer les groupes de classes',
    'manage_curriculum': 'Gérer le programme',
    'manage_classrooms': 'Gérer les salles',

    'add_room': 'Ajouter une salle',
    'manage_rooms': 'Gérer les salles et leurs capacités',
    'capacity': 'Capacité',
    'type': 'Type',

    'teaching_overview': 'Aperçu de votre enseignement',
    'weekly_lessons': 'Cours de la semaine',
    'view_schedule': 'Voir l\'emploi du temps',
    'set_availability': 'Définir la disponibilité',
    'quick_links': 'Liens rapides',

    'weekly_timetable': 'Votre emploi du temps hebdomadaire',
    'lessons_this_week': 'cours cette semaine',
    'no_lessons': 'Pas de cours',
    'no_schedule_yet': 'Pas encore d\'emploi du temps',
    'schedule_appear_msg': 'Votre emploi du temps apparaîtra ici une fois généré.',

    'my_availability': 'Ma disponibilité',
    'set_when_available': 'Définissez quand vous êtes disponible pour enseigner',
    'save_availability': 'Enregistrer la disponibilité',
    'check_timeslots': 'Cochez les créneaux où vous êtes disponible.',
    'no_timeslots': 'Pas de créneaux configurés',
    'contact_admin_timeslots': 'Contactez votre administrateur pour configurer les créneaux.',

    'generate_manage_schedules': 'Générer et gérer les emplois du temps optimisés',
    'solving': 'Résolution...',
    'generate': 'Générer',
    'stop': 'Arrêter',
    'export': 'Exporter',
    'refresh': 'Actualiser',
    'ai_solver_working': 'Le solveur IA travaille...',
    'view_by': 'Afficher par :',
    'grid_view': 'Vue grille',
    'card_view': 'Vue cartes',
    'filter_class': 'Filtrer classe :',
    'filter_teacher': 'Filtrer enseignant :',
    'all_classes': 'Toutes les classes',
    'all_teachers': 'Tous les enseignants',
    'no_timetable_yet': 'Pas encore d\'emploi du temps',
    'click_generate_msg': 'Cliquez sur "Générer" pour lancer le solveur IA et créer un emploi du temps optimisé.',
    'lessons': 'cours',
    'time': 'Heure',

    'search_classes': 'Rechercher des classes...',
    'search_subjects': 'Rechercher des matières...',
    'search_rooms': 'Rechercher des salles...',

    'delete_class': 'Supprimer la classe',
    'delete_subject': 'Supprimer la matière',
    'delete_room': 'Supprimer la salle',
    'this_cannot_be_undone': 'Cette action est irréversible.',

    'seats': 'places',
    'general': 'Générale',
    'lecture_hall': 'Amphithéâtre',
    'lab': 'Laboratoire',
    'computer_lab': 'Salle informatique',
    'workshop': 'Atelier',
    'gymnasium': 'Gymnase',
    'library': 'Bibliothèque',

    'welcome_back_msg_teacher': 'Consultez votre emploi du temps et gérez vos préférences de disponibilité.',

    'level_n': 'Niveau',

    'MONDAY': 'Lundi',
    'TUESDAY': 'Mardi',
    'WEDNESDAY': 'Mercredi',
    'THURSDAY': 'Jeudi',
    'FRIDAY': 'Vendredi',
    'SATURDAY': 'Samedi',
    'SUNDAY': 'Dimanche',

    // Timeslots
    'timeslots': 'Créneaux horaires',
    'timeslot': 'créneau',
    'manage_timeslots_desc': 'Configurer les périodes de cours et les créneaux horaires',
    'add_timeslot': 'Ajouter un créneau',
    'add_new_timeslot': 'Ajouter un nouveau créneau',
    'edit_timeslot': 'Modifier le créneau',
    'remove_timeslot': 'Supprimer le créneau',
    'remove': 'Supprimer',
    'day': 'Jour',
    'start_time': 'Heure de début',
    'end_time': 'Heure de fin',
    'order': 'Ordre',
    'order_in_day': 'Ordre dans la journée',
    'select_day': 'Sélectionner un jour',
    'all_days': 'Tous les jours',
    'no_timeslots_yet': 'Pas encore de créneaux',
    'create_first_timeslot': 'Créez votre premier créneau pour commencer.',
    'try_different_filter': 'Essayez un filtre différent.',

    // Edit admin
    'edit_admin': 'Modifier l\'admin'
  },
  ar: {
    'save': 'حفظ',
    'cancel': 'إلغاء',
    'delete': 'حذف',
    'edit': 'تعديل',
    'create': 'إنشاء',
    'update': 'تحديث',
    'search': 'بحث',
    'actions': 'إجراءات',
    'loading': 'جاري التحميل...',
    'no_results': 'لا توجد نتائج',

    'welcome_back': 'مرحبًا بعودتك',
    'sign_in': 'تسجيل الدخول',
    'sign_in_subtitle': 'سجل الدخول إلى حسابك للمتابعة',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'signing_in': 'جاري تسجيل الدخول...',
    'contact_admin': 'تواصل مع المسؤول إذا كنت بحاجة إلى حساب',

    'main_menu': 'القائمة الرئيسية',
    'account': 'الحساب',
    'my_profile': 'ملفي الشخصي',
    'sign_out': 'تسجيل الخروج',

    'dashboard': 'لوحة التحكم',
    'platform_overview': 'نظرة عامة على المنصة والإجراءات السريعة',
    'welcome_back_name': 'مرحبًا بعودتك',
    'schools': 'المدارس',
    'administrators': 'المسؤولون',
    'total_users': 'إجمالي المستخدمين',
    'add_school': 'إضافة مدرسة',
    'add_admin': 'إضافة مسؤول',
    'quick_actions': 'إجراءات سريعة',
    'manage_schools': 'إدارة المدارس',
    'manage_admins': 'إدارة المسؤولين',
    'add_edit_schools': 'إضافة أو تعديل أو تعطيل المدارس',
    'assign_admins': 'تعيين مسؤولين للمدارس',

    'manage_all_schools': 'إدارة جميع المدارس في المنصة',
    'school_name': 'اسم المدرسة',
    'address': 'العنوان',
    'phone': 'الهاتف',
    'status': 'الحالة',
    'active': 'نشط',
    'inactive': 'غير نشط',
    'all_status': 'جميع الحالات',
    'statistics': 'إحصائيات',

    'manage_admin_accounts': 'إدارة حسابات المسؤولين عبر المدارس',
    'admin': 'مسؤول',
    'school': 'مدرسة',
    'add_new_admin': 'إضافة مسؤول جديد',
    'first_name': 'الاسم الأول',
    'last_name': 'اسم العائلة',
    'assign_to_school': 'تعيين لمدرسة',
    'no_school_assigned': 'لم يتم تعيين مدرسة',
    'creating': 'جاري الإنشاء...',
    'create_admin': 'إنشاء مسؤول',
    'remove_admin': 'حذف المسؤول',
    'change_password': 'تغيير كلمة المرور',
    'new_password': 'كلمة المرور الجديدة',
    'confirm_password': 'تأكيد كلمة المرور',
    'passwords_no_match': 'كلمات المرور غير متطابقة',
    'changing': 'جاري التغيير...',

    'teachers': 'المعلمون',
    'manage_teachers': 'إدارة الطاقم التعليمي وتوزيع المواد',
    'add_teacher': 'إضافة معلم',
    'teacher': 'معلم',
    'max_hours': 'الحد الأقصى للساعات',
    'subjects': 'المواد',

    'classes': 'الأقسام',
    'manage_classes': 'إدارة الأقسام وعدد التلاميذ',
    'add_class': 'إضافة قسم',
    'name': 'الاسم',
    'level': 'المستوى',
    'students': 'التلاميذ',
    'select_level': 'اختر المستوى',
    'number_of_students': 'عدد التلاميذ',

    'manage_subjects': 'إدارة المواد ومعايير الجدولة',
    'add_subject': 'إضافة مادة',
    'hours_week': 'ساعات/أسبوع',
    'session_duration': 'مدة الحصة',

    'rooms': 'القاعات',
    'timetable': 'جدول الحصص',

    'manage_account': 'إدارة معلومات حسابك',
    'profile_information': 'معلومات الملف الشخصي',
    'current_password': 'كلمة المرور الحالية',
    'confirm_new_password': 'تأكيد كلمة المرور الجديدة',
    'save_changes': 'حفظ التغييرات',
    'saving': 'جاري الحفظ...',

    'my_schedule': 'جدولي',
    'availability': 'التوفر',

    'super_admin': 'المسؤول الأعلى',
    'administrator': 'المسؤول',
    'role_teacher': 'معلم',

    'school_management_overview': 'نظرة عامة على إدارة المدرسة',
    'generate_timetable': 'إنشاء جدول الحصص',
    'manage_teaching_staff': 'إدارة الطاقم التعليمي',
    'manage_class_groups': 'إدارة مجموعات الأقسام',
    'manage_curriculum': 'إدارة المنهج',
    'manage_classrooms': 'إدارة القاعات',

    'add_room': 'إضافة قاعة',
    'manage_rooms': 'إدارة القاعات وسعتها',
    'capacity': 'السعة',
    'type': 'النوع',

    'teaching_overview': 'نظرة عامة على تعليمك',
    'weekly_lessons': 'دروس الأسبوع',
    'view_schedule': 'عرض الجدول',
    'set_availability': 'تحديد التوفر',
    'quick_links': 'روابط سريعة',

    'weekly_timetable': 'جدولك الأسبوعي',
    'lessons_this_week': 'دروس هذا الأسبوع',
    'no_lessons': 'لا توجد دروس',
    'no_schedule_yet': 'لا يوجد جدول بعد',
    'schedule_appear_msg': 'سيظهر جدولك هنا بمجرد إنشاء جدول الحصص.',

    'my_availability': 'توفري',
    'set_when_available': 'حدد متى تكون متاحًا للتدريس',
    'save_availability': 'حفظ التوفر',
    'check_timeslots': 'حدد الفترات الزمنية التي تكون فيها متاحًا للتدريس.',
    'no_timeslots': 'لا توجد فترات زمنية مهيأة',
    'contact_admin_timeslots': 'تواصل مع المسؤول لإعداد الفترات الزمنية.',

    'generate_manage_schedules': 'إنشاء وإدارة الجداول المحسّنة',
    'solving': 'جاري الحل...',
    'generate': 'توليد',
    'stop': 'إيقاف',
    'export': 'تصدير',
    'refresh': 'تحديث',
    'ai_solver_working': 'محرك الذكاء الاصطناعي يعمل...',
    'view_by': 'عرض حسب:',
    'grid_view': 'عرض شبكي',
    'card_view': 'عرض بطاقات',
    'filter_class': 'تصفية القسم:',
    'filter_teacher': 'تصفية المعلم:',
    'all_classes': 'جميع الأقسام',
    'all_teachers': 'جميع المعلمين',
    'no_timetable_yet': 'لا يوجد جدول حصص بعد',
    'click_generate_msg': 'انقر "توليد" لبدء محرك الذكاء الاصطناعي وإنشاء جدول محسّن.',
    'lessons': 'دروس',
    'time': 'الوقت',

    'search_classes': 'البحث عن أقسام...',
    'search_subjects': 'البحث عن مواد...',
    'search_rooms': 'البحث عن قاعات...',

    'delete_class': 'حذف القسم',
    'delete_subject': 'حذف المادة',
    'delete_room': 'حذف القاعة',
    'this_cannot_be_undone': 'لا يمكن التراجع عن هذا.',

    'seats': 'مقاعد',
    'general': 'عامة',
    'lecture_hall': 'قاعة محاضرات',
    'lab': 'مختبر',
    'computer_lab': 'مختبر حاسوب',
    'workshop': 'ورشة',
    'gymnasium': 'صالة رياضية',
    'library': 'مكتبة',

    'welcome_back_msg_teacher': 'اطلع على جدولك الأسبوعي وأدر تفضيلات توفرك.',

    'level_n': 'المستوى',

    'MONDAY': 'الإثنين',
    'TUESDAY': 'الثلاثاء',
    'WEDNESDAY': 'الأربعاء',
    'THURSDAY': 'الخميس',
    'FRIDAY': 'الجمعة',
    'SATURDAY': 'السبت',
    'SUNDAY': 'الأحد',

    // Timeslots
    'timeslots': 'الفترات الزمنية',
    'timeslot': 'فترة',
    'manage_timeslots_desc': 'تهيئة فترات الحصص وأوقات الجدولة',
    'add_timeslot': 'إضافة فترة',
    'add_new_timeslot': 'إضافة فترة جديدة',
    'edit_timeslot': 'تعديل الفترة',
    'remove_timeslot': 'حذف الفترة',
    'remove': 'حذف',
    'day': 'اليوم',
    'start_time': 'وقت البداية',
    'end_time': 'وقت النهاية',
    'order': 'الترتيب',
    'order_in_day': 'الترتيب في اليوم',
    'select_day': 'اختر يومًا',
    'all_days': 'جميع الأيام',
    'no_timeslots_yet': 'لا توجد فترات بعد',
    'create_first_timeslot': 'أنشئ فترتك الأولى للبدء.',
    'try_different_filter': 'جرب فلترًا مختلفًا.',

    // Edit admin
    'edit_admin': 'تعديل المسؤول'
  }
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private currentLang: Language;
  private langSubject: BehaviorSubject<Language>;

  lang$;

  readonly languages: { code: Language; label: string; dir: 'ltr' | 'rtl' }[] = [
    { code: 'en', label: 'English', dir: 'ltr' },
    { code: 'fr', label: 'Français', dir: 'ltr' },
    { code: 'ar', label: 'العربية', dir: 'rtl' }
  ];

  constructor() {
    this.currentLang = 'fr';
    this.langSubject = new BehaviorSubject<Language>(this.currentLang);
    this.lang$ = this.langSubject.asObservable();
    this.applyDirection();
  }

  get lang(): Language {
    return this.currentLang;
  }

  setLanguage(lang: Language): void {
    this.currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    this.langSubject.next(lang);
    this.applyDirection();
  }

  t(key: string): string {
    return translations[this.currentLang]?.[key] ?? translations['en']?.[key] ?? key;
  }

  private applyDirection(): void {
    const info = this.languages.find(l => l.code === this.currentLang);
    document.documentElement.dir = info?.dir ?? 'ltr';
    document.documentElement.lang = this.currentLang;
  }
}

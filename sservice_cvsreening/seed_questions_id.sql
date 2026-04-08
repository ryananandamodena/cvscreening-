-- =====================================================
-- CV SCREENING - SEED PERTANYAAN INTERVIEW (BAHASA INDONESIA)
-- =====================================================
-- Menggunakan subquery untuk mencari job_id berdasarkan judul
-- =====================================================

-- Catatan: Jalankan file ini SETELAH seed_questions.sql
-- File ini menambahkan pertanyaan Bahasa Indonesia ke bank pertanyaan yang sudah ada

INSERT INTO
    interview_questions (
        job_id,
        question,
        category,
        difficulty,
        is_required
    )
VALUES
    -- 1. Senior Full Stack Engineer
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Ceritakan tentang proyek menantang di mana Anda harus mengelola tanggung jawab frontend dan backend secara bersamaan.',
        'behavioral',
        'medium',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Bagaimana cara Anda memprioritaskan tugas ketika bekerja dalam tenggat waktu yang ketat?',
        'behavioral',
        'easy',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Ceritakan pengalaman Anda membimbing developer junior. Apa hasilnya?',
        'behavioral',
        'medium',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Apa proses Anda dalam melakukan code review dan memastikan standar engineering yang tinggi?',
        'behavioral',
        'medium',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Mengapa Anda tertarik bekerja dengan tech stack kami (React/Go)?',
        'behavioral',
        'easy',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Jelaskan perbedaan antara optimistic dan pessimistic concurrency control dalam desain database.',
        'technical',
        'hard',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Bagaimana cara Anda mengoptimasi aplikasi React yang mengalami lag performa yang signifikan?',
        'technical',
        'medium',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Jelaskan bagaimana Anda mendesain sistem rate-limiting untuk API dengan traffic tinggi.',
        'technical',
        'hard',
        true
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Apa kelebihan dan kekurangan arsitektur microservices dibandingkan monolith?',
        'technical',
        'medium',
        false
    ),
    (
        (
            SELECT id
            FROM job_descriptions
            WHERE
                title = 'Senior Full Stack Engineer'
            LIMIT 1
        ),
        'Bagaimana cara Anda mengelola state management dalam aplikasi TypeScript skala besar?',
        'technical',
        'medium',
        false
    ),

-- 2. Product Manager
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda harus menolak permintaan stakeholder penting. Bagaimana Anda menanganinya?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Bagaimana cara Anda memutuskan fitur apa yang masuk ke dalam product roadmap?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Ceritakan tentang peluncuran produk yang tidak berjalan sesuai rencana. Apa yang Anda pelajari?',
    'behavioral',
    'hard',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Bagaimana cara Anda mengikuti tren terbaru di industri AI dan rekrutmen?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Metrik apa yang Anda anggap paling penting untuk mengukur product-market fit?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Jelaskan konsep "MVP" dan bagaimana Anda mengaplikasikannya pada fitur AI.',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Bagaimana cara Anda menggunakan data analytics untuk mengidentifikasi pain points pengguna di platform SaaS?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Apa saja kendala teknis yang harus dipertimbangkan PM ketika mengimplementasikan fitur berbasis LLM?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Jelaskan langkah-langkah melakukan A/B test untuk landing page baru.',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Product Manager'
        LIMIT 1
    ),
    'Bagaimana cara Anda mengelola trade-off antara technical debt dan pengembangan fitur baru?',
    'technical',
    'medium',
    false
),

-- 3. UI/UX Designer
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Apa proses Anda dalam mengumpulkan kebutuhan awal untuk proyek desain baru?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda menerima feedback kritis atas desain Anda. Bagaimana reaksi dan iterasi Anda?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Bagaimana cara Anda memperjuangkan kebutuhan pengguna ketika stakeholder memiliki prioritas yang berbeda?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Ceritakan tantangan desain yang Anda selesaikan yang secara signifikan meningkatkan engagement pengguna.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Bagaimana cara Anda menangani deadline ketat sambil tetap menjaga kualitas output desain?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Jelaskan pendekatan Anda dalam memelihara dan menskalakan Design System di Figma.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Apa saja prinsip utama Web Content Accessibility Guidelines (WCAG) yang Anda ikuti?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Bagaimana cara Anda menyerahkan high-fidelity prototype ke developer untuk implementasi?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Apa perbedaan antara "Information Architecture" dan "Visual Hierarchy"?',
    'technical',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'UI/UX Designer'
        LIMIT 1
    ),
    'Bagaimana Anda menggunakan prototyping untuk menguji alur pengguna sebelum implementasi akhir?',
    'technical',
    'medium',
    false
),

-- 4. DevOps Engineer
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Ceritakan pengalaman Anda menangani outage produksi yang kritis. Langkah apa yang Anda ambil?',
    'behavioral',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Bagaimana Anda menyeimbangkan kecepatan deployment dengan stabilitas sistem?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Ceritakan pengalaman Anda mengimplementasikan otomasi yang menghemat waktu tim secara signifikan.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Bagaimana cara Anda menjaga kemampuan teknis tetap up-to-date di dunia DevOps yang bergerak cepat?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Apa filosofi Anda tentang "Infrastructure as Code" dan manfaatnya bagi tim?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Bagaimana cara Anda mengelola dan mengamankan secrets di cluster Kubernetes multi-tenant?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Jelaskan komponen-komponen pipeline CI/CD yang robust untuk aplikasi terkontainerisasi.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Apa perbedaan utama antara Horizontal dan Vertical Pod Autoscaling di Kubernetes?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Bagaimana Anda mengimplementasikan zero-downtime deployment untuk layanan database stateful?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'DevOps Engineer'
        LIMIT 1
    ),
    'Metrik monitoring apa yang Anda anggap paling kritis untuk aplikasi web terdistribusi?',
    'technical',
    'medium',
    false
),

-- 5. Data Scientist
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Bagaimana cara Anda menjelaskan hasil machine learning yang kompleks kepada stakeholder non-teknis?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Ceritakan pengalaman Anda menangani dataset yang sangat berantakan atau tidak lengkap.',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Apa model atau teknik ML favorit Anda? Mengapa?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika model Anda memberikan hasil yang tidak terduga. Bagaimana Anda menginvestigasinya?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Bagaimana Anda mendefinisikan kesuksesan untuk sebuah eksperimen data science?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Ketika memilih antara akurasi model dan interpretabilitas model, bagaimana Anda memutuskan?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Jelaskan masalah "Overfitting" dan tiga metode yang Anda gunakan untuk mencegahnya.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Bagaimana Natural Language Processing (NLP) bekerja dalam mengekstraksi entitas dari CV?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Apa perbedaan antara regularisasi L1 dan L2?',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Data Scientist'
        LIMIT 1
    ),
    'Jelaskan bagaimana Anda mengimplementasikan sistem rekomendasi untuk mencocokkan kandidat dengan lowongan.',
    'technical',
    'hard',
    true
),

-- 6. Frontend Developer (React)
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Apa yang paling Anda sukai dan tidak sukai dari bekerja dengan React?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda harus mengimplementasikan fitur yang awalnya tidak Anda setujui.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Bagaimana cara Anda mengikuti perkembangan terbaru React dan ekosistem frontend?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Ceritakan pengalaman Anda mengoptimasi kode. Apa dampaknya?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Apa arti "Clean Code" bagi Anda dalam konteks pengembangan React?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Bagaimana cara kerja React Hooks secara internal? Jelaskan aturan-aturan hooks.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Apa itu "Virtual DOM" dan bagaimana kontribusinya terhadap performa React?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Jelaskan berbagai pola untuk berbagi state antar komponen di React.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Bagaimana cara mengimplementasikan code splitting dan lazy loading di aplikasi Vite/React?',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Frontend Developer (React)'
        LIMIT 1
    ),
    'Apa keuntungan menggunakan TypeScript dengan React dibandingkan JavaScript biasa?',
    'technical',
    'easy',
    false
),

-- 7. Backend Engineer (Go)
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Mengapa Anda memilih Go dibanding bahasa backend lain seperti Java atau Python?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda harus me-refactor kode Go yang besar.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Bagaimana cara Anda menangani ketidaksepakatan dengan arsitek atau lead senior Anda?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Apa pendekatan Anda dalam menulis unit test yang bermakna dan mudah dipelihara di Go?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Ceritakan pengalaman Anda menyelesaikan bug concurrency yang kompleks.',
    'behavioral',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Jelaskan bagaimana Goroutine dan Channel bekerja sama untuk mencapai concurrency di Go.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Apa perbedaan antara pointer receiver dan value receiver pada method Go?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Bagaimana cara Anda mengoptimasi query PostgreSQL yang terlalu lambat?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Jelaskan tipe "Interface" di Go dan mengapa berguna untuk desain yang terdecouple.',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Backend Engineer (Go)'
        LIMIT 1
    ),
    'Bagaimana cara kerja garbage collector Go, dan bagaimana karakteristik performanya?',
    'technical',
    'hard',
    false
),

-- 8. QA Engineer
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Bagaimana cara Anda memprioritaskan test case mana yang harus diotomasi terlebih dahulu?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Ceritakan tentang bug yang Anda temukan yang sangat sulit untuk direproduksi.',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Bagaimana cara Anda mengkomunikasikan bug kritis kepada developer dalam kondisi deadline?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda harus mempelajari tool atau framework testing baru dengan cepat.',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Apa filosofi Anda tentang "Manual Testing" vs "Automated Testing"?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Jelaskan "Testing Pyramid" dan bagaimana pengaruhnya terhadap strategi testing Anda.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Bagaimana cara Anda melakukan API testing menggunakan tools seperti Postman atau REST Assured?',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Apa itu "Data-Driven Testing" dan bagaimana Anda mengimplementasikannya dalam otomasi?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Bagaimana cara Anda menangani flaky tests di pipeline CI/CD?',
    'technical',
    'hard',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'QA Engineer'
        LIMIT 1
    ),
    'Jelaskan perbedaan antara Integration Testing dan End-to-End Testing.',
    'technical',
    'easy',
    false
),

-- 9. Marketing Manager
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Ceritakan tentang kampanye marketing paling sukses Anda. Metrik apa yang membuatnya sukses?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Bagaimana cara Anda menangani kampanye yang performanya jauh di bawah ekspektasi?',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda harus bekerja dengan budget sangat terbatas untuk mencapai target besar.',
    'behavioral',
    'hard',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Bagaimana Anda menjaga konsistensi brand voice di berbagai channel digital?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Apa pendekatan Anda dalam mengelola tim profesional kreatif dan analitis?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Apa saja komponen utama dari marketing funnel B2B SaaS yang sukses?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Bagaimana Anda memanfaatkan SEO dan Content Marketing untuk mendorong akuisisi pengguna organik?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Jelaskan konsep "CAC" dan "LTV" serta hubungannya dengan efisiensi marketing.',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Bagaimana Anda menggunakan marketing automation tools untuk nurture leads sepanjang siklus penjualan?',
    'technical',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Marketing Manager'
        LIMIT 1
    ),
    'Apa metode Anda untuk melakukan analisis kompetitif di industri HRTech?',
    'technical',
    'easy',
    false
),

-- 10. Customer Success Manager
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda harus menangani pelanggan yang sangat sulit atau marah.',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Bagaimana cara Anda mengelola waktu ketika memiliki portofolio klien yang besar?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Ceritakan pengalaman ketika Anda berhasil mencegah klien untuk churn.',
    'behavioral',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Bagaimana cara Anda memperkenalkan fitur baru kepada klien yang resisten terhadap perubahan?',
    'behavioral',
    'medium',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Apa arti "Customer Delight" bagi Anda dalam konteks bisnis?',
    'behavioral',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Bagaimana Anda mengukur "Health Score" pelanggan di platform SaaS?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Jelaskan proses onboarding untuk klien enterprise bernilai tinggi.',
    'technical',
    'easy',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Bagaimana Anda mengidentifikasi peluang upsell atau ekspansi dalam akun yang sudah ada?',
    'technical',
    'medium',
    true
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Apa KPI terpenting yang Anda pantau untuk mengukur kepuasan pelanggan?',
    'technical',
    'easy',
    false
),
(
    (
        SELECT id
        FROM job_descriptions
        WHERE
            title = 'Customer Success Manager'
        LIMIT 1
    ),
    'Bagaimana Anda menggunakan data CRM untuk memprioritaskan aktivitas outreach klien harian?',
    'technical',
    'medium',
    false
);
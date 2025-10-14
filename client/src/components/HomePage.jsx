import React from 'react';
// Styles for this component are in App.css, which is imported in the main App.jsx file.

const HomePage = () => {
    // SVG Icon for features
    const FeatureIcon = () => (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#800000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
    );

    return (
        <div className="home-container">
        <section className="hero-section">
            <h1>Welcome to ClassLink Online</h1>
            <p>Your central hub for academic excellence and seamless university life.</p>
        </section>

        <section className="features-section">
            <h2>Everything You Need, All in One Place</h2>
            <div className="features-grid">
            <div className="feature-card">
                <FeatureIcon />
                <h3>Track Your Grades</h3>
                <p>Stay updated with your academic performance in real-time. View grades, track your GPA, and monitor your progress each semester.</p>
            </div>
            <div className="feature-card">
                <FeatureIcon />
                <h3>Manage Your Schedule</h3>
                <p>Access your class schedule, get reminders for upcoming classes, and view important academic calendar dates effortlessly.</p>
            </div>
            <div className="feature-card">
                <FeatureIcon />
                <h3>Connect with Peers</h3>
                <p>Engage with classmates, join study groups, and collaborate on projects through our integrated communication platform.</p>
            </div>
            </div>
        </section>

        <section className="content-section">
            <h2>About CIT-U Online</h2>
            <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. 
            </p>
            <p>
            Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa. Fusce ac turpis quis ligula lacinia aliquet. 
            </p>
            <p>
            Mauris ipsum. Nulla metus metus, ullamcorper vel, tincidunt sed, euismod in, nibh. Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam nec ante. Sed lacinia, urna non tincidunt mattis, tortor neque adipiscing diam, a cursus ipsum ante quis turpis. Nulla facilisi. Ut fringilla. Suspendisse potenti. Nunc feugiat mi a tellus consequat imperdiet. Vestibulum sapien. Proin quam.
            </p>
        </section>
        </div>
    );
};

export default HomePage;
export default function PrivacyPage() {
  return (
    <main className="page">
      <div className="container">
        <article className="prose">
          <h1>Privacy Policy</h1>
          <p className="updated">Last updated: October 2026</p>

          <h2>What information we collect</h2>
          <p>
            When you register, we collect your username, email address, and a
            hashed version of your password. We do not store your password in
            plain text.
          </p>
          <p>
            When you take a quiz, we store your submitted answers and the
            resulting score in your account. This is necessary to show you your
            quiz history.
          </p>
          <p>
            We do not collect payment information, location data, or device
            fingerprints.
          </p>

          <h2>How we use your information</h2>
          <ul>
            <li>To authenticate you when you log in.</li>
            <li>To generate quizzes using an AI model API. Your topic input is sent to a third-party AI provider to generate questions. We do not send your personal details to the AI provider.</li>
            <li>To save and display your quiz results.</li>
          </ul>

          <h2>Third-party services</h2>
          <p>
            Quiz generation uses an external AI model API (Google Gemini or
            OpenAI). The topic you enter is sent to that provider. Their
            respective privacy policies govern how they handle that data.
          </p>
          <p>
            We do not use analytics trackers, advertising networks, or social
            media tracking pixels.
          </p>

          <h2>Data storage</h2>
          <p>
            Your data is stored in a MongoDB database. Authentication tokens are
            stored in your browser&apos;s localStorage and expire after 7 days.
          </p>

          <h2>Your rights</h2>
          <p>
            You may request deletion of your account and all associated data by
            contacting us. We will process deletion requests within 30 days.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy-related questions, contact us at the email address on
            our GitHub repository.
          </p>
        </article>
      </div>
    </main>
  );
}

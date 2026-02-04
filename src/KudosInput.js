import React, { useState } from 'react';
import './KudosInput.css';

function KudosInput() {
  const [kudosText, setKudosText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kudosText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const kudosUrl = process.env.REACT_APP_KUDOS_URL;

    if (!kudosUrl) {
      console.error('REACT_APP_KUDOS_URL is not configured');
      setError('Submission is not configured. Please try again later.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(kudosUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires no-cors from browser
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment: kudosText.trim() }),
      });

      // With no-cors, we can't read the response, so we assume success if no error thrown
      console.log('Kudos submitted successfully');
      setSubmitted(true);
      setKudosText(''); // Clear the text box
      
      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Error submitting kudos:', err);
      setError('Failed to send. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="kudos-container">
      <div className="kudos-title-container">
        <span className="kudos-title">kudos to the chefs</span>
      </div>
      
      <form onSubmit={handleSubmit} className="kudos-form">
        <textarea
          className="kudos-input"
          placeholder="Leave a message for the chef..."
          value={kudosText}
          onChange={(e) => setKudosText(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
        <button 
          type="submit" 
          className="kudos-submit"
          disabled={isSubmitting || !kudosText.trim()}
        >
          {isSubmitting ? 'Sending...' : submitted ? 'Sent!' : 'Send'}
        </button>
      </form>
      
      {submitted && (
        <p className="kudos-success">Thank you for your kind words!</p>
      )}
      {error && (
        <p className="kudos-error">{error}</p>
      )}
    </div>
  );
}

export default KudosInput;

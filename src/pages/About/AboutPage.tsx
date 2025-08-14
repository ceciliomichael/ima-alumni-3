import { useState, useEffect } from 'react';
import { Info, FileText, Users, MapPin, Mail, Phone, Building, ChevronRight, Check } from 'lucide-react';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import { addContactMessage } from '../Admin/services/localStorage/contactService';
import './About.css';

type TabType = 'history' | 'vision' | 'organization' | 'contact';

interface AboutPageProps {
  initialTab?: TabType;
}

const AboutPage = ({ initialTab = 'history' }: AboutPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  // Form validation
  const [formErrors, setFormErrors] = useState({
    name: false,
    email: false,
    subject: false,
    message: false
  });
  
  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error for this field if it has a value
    if (value.trim() !== '') {
      setFormErrors(prev => ({
        ...prev,
        [id]: false
      }));
    }
  };
  
  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const errors = {
      name: contactForm.name.trim() === '',
      email: contactForm.email.trim() === '' || !contactForm.email.includes('@'),
      subject: contactForm.subject.trim() === '',
      message: contactForm.message.trim() === ''
    };
    
    setFormErrors(errors);
    
    // If there are errors, don't submit
    if (Object.values(errors).some(error => error)) {
      return;
    }
    
    // Submit the form data to localStorage
    addContactMessage({
      name: contactForm.name,
      email: contactForm.email,
      subject: contactForm.subject,
      message: contactForm.message
    });
    
    // Reset form and show success message
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
    
    setFormSubmitted(true);
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };
  
  // Simulate loading state on initial load
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Placeholder data for org chart
  const organizationData = {
    president: {
      title: "President",
      name: "James Rodriguez",
      batch: "2005"
    },
    vicePresident: {
      title: "Vice President",
      name: "Sarah Johnson",
      batch: "2008"
    },
    executives: [
      { title: "Secretary", name: "Mark Williams", batch: "2010" },
      { title: "Treasurer", name: "Lisa Chen", batch: "2012" },
      { title: "Public Relations", name: "David Kim", batch: "2015" }
    ]
  };

  return (
    <div className="about-page">
      <div className="about-layout">
        <div className="about-content">
          <div className="about-header">
            <div className="about-title-section">
              <div className="about-icon">
                <Info size={24} />
              </div>
              <h1>About Us</h1>
            </div>
          </div>
          
          <div className="about-tabs">
            <button 
              className={`about-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <FileText size={18} />
              <span>History</span>
            </button>
            <button 
              className={`about-tab ${activeTab === 'vision' ? 'active' : ''}`}
              onClick={() => setActiveTab('vision')}
            >
              <Info size={18} />
              <span>Vision & Mission</span>
            </button>
            <button 
              className={`about-tab ${activeTab === 'organization' ? 'active' : ''}`}
              onClick={() => setActiveTab('organization')}
            >
              <Building size={18} />
              <span>Organizational Chart</span>
            </button>
            <button 
              className={`about-tab ${activeTab === 'contact' ? 'active' : ''}`}
              onClick={() => setActiveTab('contact')}
            >
              <Mail size={18} />
              <span>Contact Us</span>
            </button>
          </div>

          {isLoading ? (
            <div className="loading-about">
              <div className="about-skeleton"></div>
            </div>
          ) : (
            <div className="about-tab-content">
              {activeTab === 'history' && (
                <div className="history-section">
                  <h2>Our History</h2>
                  <div className="history-content">
                    <div className="history-image">
                      <ImagePlaceholder
                        shape="rectangle"
                        height="300px"
                        color="#4f46e5"
                        recommendedSize="1200x400px"
                        text="Alumni History"
                      />
                    </div>
                    
                    <div className="history-timeline">
                      <div className="timeline">
                        {[2000, 2005, 2010, 2015, 2020, 2023].map((year, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-marker">
                              <div className="timeline-dot"></div>
                            </div>
                            <div className="timeline-year">{year}</div>
                            <div className="timeline-card">
                              <h3>Major Milestone {index + 1}</h3>
                              <p>This is a placeholder for historical information about our alumni association. We'll add real content about our founding, growth, and achievements soon.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'vision' && (
                <div className="vision-section">
                  <h2>Vision & Mission</h2>
                  <div className="vision-mission-content">
                    <div className="vision-card">
                      <div className="vm-card-header">
                        <h3>Our Vision</h3>
                      </div>
                      <div className="vm-card-body">
                        <p>To be the premier alumni network that fosters lifelong connections, professional growth, and meaningful contributions to our alma mater and society.</p>
                        <p>We envision a vibrant community of alumni who remain connected to their educational roots while advancing in their respective fields and making positive impacts in their communities.</p>
                      </div>
                    </div>
                    
                    <div className="mission-card">
                      <div className="vm-card-header">
                        <h3>Our Mission</h3>
                      </div>
                      <div className="vm-card-body">
                        <div className="mission-points">
                          <div className="mission-point">
                            <div className="mission-point-marker">1</div>
                            <div className="mission-point-content">
                              <h4>Foster Connections</h4>
                              <p>Create opportunities for meaningful networking and relationship-building among alumni of all generations.</p>
                            </div>
                          </div>
                          
                          <div className="mission-point">
                            <div className="mission-point-marker">2</div>
                            <div className="mission-point-content">
                              <h4>Support Career Development</h4>
                              <p>Provide resources, mentorship, and professional development opportunities to help alumni thrive in their careers.</p>
                            </div>
                          </div>
                          
                          <div className="mission-point">
                            <div className="mission-point-marker">3</div>
                            <div className="mission-point-content">
                              <h4>Give Back</h4>
                              <p>Facilitate meaningful ways for alumni to contribute to the success of current students and the institution.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'organization' && (
                <div className="organization-section">
                  <h2>Organizational Chart</h2>
                  <div className="org-chart-content">
                    <div className="org-chart">
                      <div className="org-level president-level">
                        <div className="org-card president-card">
                          <div className="org-position">President</div>
                          <div className="org-name">{organizationData.president.name}</div>
                          <div className="org-batch">Class of {organizationData.president.batch}</div>
                        </div>
                      </div>
                      
                      <div className="org-connector"></div>
                      
                      <div className="org-level vp-level">
                        <div className="org-card vp-card">
                          <div className="org-position">Vice President</div>
                          <div className="org-name">{organizationData.vicePresident.name}</div>
                          <div className="org-batch">Class of {organizationData.vicePresident.batch}</div>
                        </div>
                      </div>
                      
                      <div className="org-connector"></div>
                      
                      <div className="org-level exec-level">
                        {organizationData.executives.map((exec, index) => (
                          <div key={index} className="org-card exec-card">
                            <div className="org-position">{exec.title}</div>
                            <div className="org-name">{exec.name}</div>
                            <div className="org-batch">Class of {exec.batch}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="org-note">
                        <p>This organizational chart is a placeholder. The actual structure and members will be updated soon.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'contact' && (
                <div className="contact-section">
                  <h2>Contact Us</h2>
                  <div className="contact-content">
                    <div className="contact-info">
                      <div className="contact-card">
                        <div className="contact-icon">
                          <MapPin size={24} />
                        </div>
                        <div className="contact-details">
                          <h3>Visit Us</h3>
                          <p>123 University Avenue</p>
                          <p>Main Campus, Alumni Center</p>
                          <p>New York, NY 10001</p>
                        </div>
                      </div>
                      
                      <div className="contact-card">
                        <div className="contact-icon">
                          <Mail size={24} />
                        </div>
                        <div className="contact-details">
                          <h3>Email Us</h3>
                          <p>alumni@university.edu</p>
                          <p>support@IMA Alumni.com</p>
                        </div>
                      </div>
                      
                      <div className="contact-card">
                        <div className="contact-icon">
                          <Phone size={24} />
                        </div>
                        <div className="contact-details">
                          <h3>Call Us</h3>
                          <p>Main Office: (123) 456-7890</p>
                          <p>Support Hotline: (123) 456-7891</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="contact-form-container">
                      <h3>Send Us a Message</h3>
                      {formSubmitted ? (
                        <div className="form-success-message">
                          <Check size={24} />
                          <p>Thank you for your message! We'll get back to you soon.</p>
                        </div>
                      ) : (
                        <form className="contact-form" onSubmit={handleFormSubmit}>
                          <div className={`form-group ${formErrors.name ? 'has-error' : ''}`}>
                            <label htmlFor="name">Full Name</label>
                            <input 
                              type="text" 
                              id="name" 
                              placeholder="Enter your name" 
                              value={contactForm.name}
                              onChange={handleInputChange}
                            />
                            {formErrors.name && <span className="error-message">Please enter your name</span>}
                          </div>
                          
                          <div className={`form-group ${formErrors.email ? 'has-error' : ''}`}>
                            <label htmlFor="email">Email Address</label>
                            <input 
                              type="email" 
                              id="email" 
                              placeholder="Enter your email" 
                              value={contactForm.email}
                              onChange={handleInputChange}
                            />
                            {formErrors.email && <span className="error-message">Please enter a valid email</span>}
                          </div>
                          
                          <div className={`form-group ${formErrors.subject ? 'has-error' : ''}`}>
                            <label htmlFor="subject">Subject</label>
                            <input 
                              type="text" 
                              id="subject" 
                              placeholder="What is this regarding?" 
                              value={contactForm.subject}
                              onChange={handleInputChange}
                            />
                            {formErrors.subject && <span className="error-message">Please enter a subject</span>}
                          </div>
                          
                          <div className={`form-group ${formErrors.message ? 'has-error' : ''}`}>
                            <label htmlFor="message">Message</label>
                            <textarea 
                              id="message" 
                              rows={5} 
                              placeholder="Type your message here"
                              value={contactForm.message}
                              onChange={handleInputChange}
                            ></textarea>
                            {formErrors.message && <span className="error-message">Please enter your message</span>}
                          </div>
                          
                          <button type="submit" className="send-button">
                            <span>Send Message</span>
                            <ChevronRight size={16} />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 
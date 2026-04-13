import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Write for Us – Engineering Blog | Machrio',
  description: 'Write for Machrio and get paid for engineering content. Submit guest posts about industrial automation, motors, and engineering topics.',
  keywords: ['write for us engineering', 'engineering guest post', 'industrial blog submission', 'get paid to write engineering'],
}

export default function WriteForUsPage() {
  return (
    <div className="container-main py-8">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-secondary-900 mb-4">
          Get Paid to Write About Engineering
        </h1>
        <p className="text-xl text-secondary-600 mb-8">
          Join Machrio's Content Partner Program and earn by sharing your expertise in industrial, mechanical, and engineering topics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="#apply" className="btn-accent inline-block px-8 py-4 text-lg">
            Apply Now
          </Link>
          <Link href="#how-it-works" className="btn-secondary inline-block px-8 py-4 text-lg">
            Learn More
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-secondary-900 text-center mb-8">
          What You Get
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Paid per Article',
              description: 'Earn competitive rates based on quality and expertise',
            },
            {
              icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              ),
              title: 'Author Backlink',
              description: 'Get a do-follow backlink to your website or portfolio',
            },
            {
              icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              ),
              title: 'Global Exposure',
              description: 'Reach B2B buyers and engineers worldwide',
            },
            {
              icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              title: 'Long-term Collaboration',
              description: 'Ongoing opportunities for consistent contributors',
            },
            {
              icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              ),
              title: 'Build Authority',
              description: 'Establish yourself as an industry thought leader',
            },
            {
              icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ),
              title: 'Performance Bonus',
              description: 'Extra rewards for high-performing content',
            },
          ].map((benefit, i) => (
            <div key={i} className="rounded-lg border border-secondary-200 bg-white p-6 text-center hover:shadow-lg transition-shadow">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-700 mb-4">
                {benefit.icon}
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">{benefit.title}</h3>
              <p className="text-secondary-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who We're Looking For */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-secondary-900 text-center mb-8">
          Who We're Looking For
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            'Mechanical / Electrical Engineers',
            'Automation Engineers',
            'Technical Writers',
            'Industry Bloggers',
            'B2B Marketers (Industrial niche)',
            'Website owners (for backlink collaboration)',
          ].map((role, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-secondary-200 bg-white p-4">
              <svg className="h-6 w-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-secondary-700">{role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Topics Section */}
      <section className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-secondary-900 text-center mb-8">
          Topics You Can Write About
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            'Stepper Motors',
            'Industrial Automation',
            'Sensors & Instrumentation',
            'Paint Systems / Paint Booths',
            'Engineering Guides',
            'Product Comparisons',
            'Case Studies',
            'Motion Control Systems',
            'PLC Programming',
            'Robotics & CNC',
            'Safety Equipment',
            'Maintenance Best Practices',
          ].map((topic, i) => (
            <div key={i} className="rounded-lg bg-primary-50 border border-primary-200 p-4 text-center">
              <span className="text-primary-800 font-medium">{topic}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Content Guidelines */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-secondary-900 text-center mb-8">
          Content Guidelines
        </h2>
        <div className="rounded-lg border border-secondary-200 bg-white p-8">
          <ul className="space-y-4">
            {[
              { requirement: 'Minimum 1000 words', icon: '📝' },
              { requirement: '100% original content (no AI-generated or plagiarized content)', icon: '✍️' },
              { requirement: 'SEO-friendly structure (headings, keywords)', icon: '🔍' },
              { requirement: 'Include images or diagrams (if possible)', icon: '🖼️' },
              { requirement: 'Technically accurate and well-researched', icon: '✅' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-secondary-700 pt-1">{item.requirement}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-secondary-500 italic">
            Note: We reserve the right to edit content for SEO optimization and clarity.
          </p>
        </div>
      </section>

      {/* Payment Section */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-secondary-900 text-center mb-8">
          Payment
        </h2>
        <div className="rounded-lg border border-secondary-200 bg-white p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-3xl font-bold text-green-700 mb-2">$50-150</p>
              <p className="text-sm text-green-600">per article</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-3xl font-bold text-blue-700 mb-2">Based on</p>
              <p className="text-sm text-blue-600">quality & expertise</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-3xl font-bold text-purple-700 mb-2">Bonus</p>
              <p className="text-sm text-purple-600">high-performing content</p>
            </div>
          </div>
          <p className="text-secondary-600 text-center">
            Compensation depends on expertise, content quality, and article performance. 
            Payment is processed within 30 days of article publication.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto mb-16" id="how-it-works">
        <h2 className="text-3xl font-bold text-secondary-900 text-center mb-8">
          How It Works
        </h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200 hidden md:block"></div>
          
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Submit Your Application',
                description: 'Fill out the form below with your topic idea or pitch',
              },
              {
                step: '2',
                title: 'Team Review',
                description: 'Our editorial team reviews your submission within 3-5 business days',
              },
              {
                step: '3',
                title: 'Feedback & Revision',
                description: 'We provide feedback and suggestions if needed',
              },
              {
                step: '4',
                title: 'Content Published',
                description: 'Your article is published on Machrio.com',
              },
              {
                step: '5',
                title: 'Get Paid',
                description: 'Receive payment within 30 days of publication',
              },
            ].map((item, i) => (
              <div key={i} className="relative flex items-start gap-6">
                <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-full bg-primary-600 text-white items-center justify-center text-xl font-bold z-10">
                  {item.step}
                </div>
                <div className="flex-1 rounded-lg border border-secondary-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">{item.title}</h3>
                  <p className="text-secondary-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-secondary-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              question: 'Who owns the copyright to published articles?',
              answer: 'Machrio retains exclusive rights to published content. You maintain the right to be credited as the author and can share the published article on your personal platforms.',
            },
            {
              question: 'Can I submit articles that have been published elsewhere?',
              answer: 'We prefer original, unpublished content. However, we may consider previously published articles if they are significantly updated and exclusive to Machrio.',
            },
            {
              question: 'Do you accept non-native English speakers?',
              answer: 'Absolutely! We welcome contributors from around the world. Our editorial team will help polish the language while preserving your technical expertise.',
            },
            {
              question: 'How long does the review process take?',
              answer: 'Typically 3-5 business days for initial review. The entire process from submission to publication usually takes 2-3 weeks, depending on revision needs.',
            },
            {
              question: 'Can I include links to my own website?',
              answer: 'Yes! You can include 1-2 relevant, non-promotional links to your website or portfolio in your author bio.',
            },
          ].map((faq, i) => (
            <details key={i} className="group rounded-lg border border-secondary-200 bg-white p-6">
              <summary className="flex cursor-pointer items-center justify-between text-lg font-semibold text-secondary-900">
                {faq.question}
                <svg className="h-5 w-5 text-secondary-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-secondary-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA / Application Form */}
      <section className="max-w-2xl mx-auto" id="apply">
        <div className="rounded-lg border border-secondary-200 bg-white p-8">
          <h2 className="text-3xl font-bold text-secondary-900 text-center mb-2">
            Become a Contributor
          </h2>
          <p className="text-secondary-600 text-center mb-8">
            Ready to share your expertise? Submit your application today.
          </p>

          <form className="space-y-6" action="/api/content-partners/apply" method="POST">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-secondary-700 mb-2">
                Website / Portfolio <span className="text-secondary-400">(optional)</span>
              </label>
              <input
                type="url"
                id="website"
                name="website"
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div>
              <label htmlFor="expertise" className="block text-sm font-medium text-secondary-700 mb-2">
                Areas of Expertise *
              </label>
              <select
                id="expertise"
                name="expertise"
                required
                multiple
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                size={5}
              >
                <option value="stepper-motors">Stepper Motors</option>
                <option value="industrial-automation">Industrial Automation</option>
                <option value="sensors-instrumentation">Sensors & Instrumentation</option>
                <option value="paint-systems">Paint Systems / Paint Booths</option>
                <option value="motion-control">Motion Control Systems</option>
                <option value="plc-programming">PLC Programming</option>
                <option value="robotics-cnc">Robotics & CNC</option>
                <option value="safety-equipment">Safety Equipment</option>
                <option value="maintenance">Maintenance Best Practices</option>
                <option value="other">Other Engineering Topics</option>
              </select>
              <p className="mt-2 text-sm text-secondary-500">Hold Ctrl/Cmd to select multiple options</p>
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-secondary-700 mb-2">
                Topic Idea or Pitch *
              </label>
              <textarea
                id="topic"
                name="topic"
                required
                rows={4}
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Briefly describe your article idea or submit a draft outline..."
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
                Additional Message <span className="text-secondary-400">(optional)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tell us about your writing experience, qualifications, or any questions..."
              />
            </div>

            <button
              type="submit"
              className="w-full btn-accent py-4 text-lg font-semibold"
            >
              Submit Application
            </button>

            <p className="text-xs text-secondary-500 text-center">
              By submitting, you agree to our content guidelines and terms. We'll review your application 
              and get back to you within 3-5 business days.
            </p>
          </form>

          <div className="mt-8 pt-8 border-t border-secondary-200 text-center">
            <p className="text-secondary-600 mb-2">Prefer to email directly?</p>
            <a
              href="mailto:content@machrio.com"
              className="text-primary-700 hover:underline font-medium"
            >
              content@machrio.com
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

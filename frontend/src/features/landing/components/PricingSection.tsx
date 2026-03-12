import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '0',
    period: '14-day free trial',
    description: 'Perfect for solo advocates testing the waters.',
    features: [
      '50 documents / month',
      'AI-powered OCR extraction',
      'Validation reports',
      'Structured JSON output',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: false,
    gradient: '',
    borderColor: 'border-white/10',
  },
  {
    name: 'Professional',
    price: '2,999',
    period: '/month',
    description: 'For advocates who mean business. Unlimited power.',
    features: [
      'Unlimited documents',
      'Priority AI processing',
      'Batch upload (100+ docs)',
      'Advanced validation rules',
      'Case management integration',
      'Phone & email support',
      'Custom output templates',
    ],
    cta: 'Get Started Now',
    popular: true,
    gradient: 'from-cyan-500 to-purple-600',
    borderColor: 'border-cyan-400/50',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For firms and legal departments at scale.',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'SSO / SAML authentication',
      'Dedicated infrastructure',
      'Custom AI training',
      'SLA guarantee (99.9%)',
      'Dedicated account manager',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: '',
    borderColor: 'border-white/10',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative bg-[#0A0E27] py-28">
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-600/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="mb-4 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            Simple Pricing
          </span>
          <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
            Invest in Your{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Competitive Edge
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Start free, scale when you're ready. No hidden fees. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-sm ${
                plan.popular
                  ? `${plan.borderColor} bg-white/[0.06] shadow-[0_0_50px_rgba(0,255,255,0.1)]`
                  : `${plan.borderColor} bg-white/[0.03]`
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-3 py-1">
                  <Sparkles size={12} className="text-white" />
                  <span className="text-xs font-bold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Gradient top border */}
              {plan.popular && (
                <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" />
              )}

              <div className="flex flex-1 flex-col p-8">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

                <div className="mt-6">
                  {plan.price === 'Custom' ? (
                    <span className="text-4xl font-black text-white">Custom</span>
                  ) : (
                    <>
                      <span className="text-sm text-gray-500">₹</span>
                      <span className="text-5xl font-black text-white">
                        {plan.price}
                      </span>
                    </>
                  )}
                  <span className="ml-1 text-sm text-gray-500">
                    {plan.period}
                  </span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-gray-300"
                    >
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.popular ? 'text-cyan-400' : 'text-gray-500'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.popular ? '/login' : '#'}
                  className={`mt-8 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:brightness-110'
                      : 'border border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight size={16} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Money-back guarantee */}
        <motion.p
          className="mt-12 text-center text-sm text-gray-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          🔒 30-day money-back guarantee • No credit card required for trial • Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}

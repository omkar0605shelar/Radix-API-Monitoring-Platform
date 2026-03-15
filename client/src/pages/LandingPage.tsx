import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ArrowRight, Code, Database, RefreshCw, Layers, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center bg-gradient-to-b from-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Understand and Document Your APIs <span className="text-primary">Automatically</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            API Insight converts backend code into clean API documentation, endpoint diagrams, and request/response examples automatically.
          </p>
          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link to="/register" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 rounded-lg text-lg font-medium inline-flex items-center justify-center transition-colors">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a href="#demo" className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-12 px-8 rounded-lg text-lg font-medium inline-flex items-center justify-center transition-colors">
              View Demo
            </a>
          </div>
        </motion.div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 bg-background px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-16">How API Insight Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Upload Repo', desc: 'Connect your GitHub repository to securely clone your backend code.', icon: <Database className="w-8 h-8 text-primary" /> },
              { step: '02', title: 'Code Scanning', desc: 'The system automatically detects Express routes and API handlers.', icon: <Code className="w-8 h-8 text-primary" /> },
              { step: '03', title: 'Extract Schemas', desc: 'Request and response JSON schemas are extracted from source code AST.', icon: <Layers className="w-8 h-8 text-primary" /> },
              { step: '04', title: 'Instant Docs', desc: 'Interactive API documentation is generated instantly for your team.', icon: <CheckCircle className="w-8 h-8 text-primary" /> }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col items-center text-center space-y-4"
              >
                <div className="p-4 bg-primary/10 rounded-full">{item.icon}</div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 bg-muted/30 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-16">API Insight vs Hoppscotch</h2>
          <div className="overflow-x-auto rounded-xl border border-border mt-8 bg-card shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-4 font-semibold text-lg w-1/3">Feature Category</th>
                  <th className="p-4 font-semibold text-lg border-l border-border bg-background/50">Hoppscotch</th>
                  <th className="p-4 font-semibold text-lg border-l border-border bg-primary/5 text-primary">API Insight</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border"><td className="p-4 font-bold col-span-3 text-muted-foreground uppercase text-xs pt-6">API Designing</td></tr>
                <tr className="border-b border-border">
                  <td className="p-4">Visual API Design</td>
                  <td className="p-4 border-l border-border text-center">✅</td>
                  <td className="p-4 border-l border-border text-center bg-primary/5">✅</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Generate API Spec from Code</td>
                  <td className="p-4 border-l border-border text-center text-muted-foreground">❌</td>
                  <td className="p-4 border-l border-border text-center bg-primary/5">✅</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Auto Generate Requests & Responses</td>
                  <td className="p-4 border-l border-border text-center text-muted-foreground">Manual</td>
                  <td className="p-4 border-l border-border text-center bg-primary/5">Automatic</td>
                </tr>
                
                <tr className="border-b border-border"><td className="p-4 font-bold col-span-3 text-muted-foreground uppercase text-xs pt-6">API Documentation</td></tr>
                 <tr className="border-b border-border">
                  <td className="p-4">Zero-effort Setup</td>
                  <td className="p-4 border-l border-border text-center text-muted-foreground">❌</td>
                  <td className="p-4 border-l border-border text-center bg-primary/5">✅</td>
                </tr>
                 <tr className="border-b border-border">
                  <td className="p-4">Custom Layout</td>
                  <td className="p-4 border-l border-border text-center">✅</td>
                  <td className="p-4 border-l border-border text-center bg-primary/5">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground">
        <p>&copy; 2026 API Insight. The Automatic API Design-First Platform.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

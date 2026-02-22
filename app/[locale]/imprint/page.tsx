import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Imprint',
    description: 'Legal disclosure (Impressum) for Gosimy.',
    robots: { index: true, follow: true },
};

export default function ImprintPage() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-3xl font-bold mb-2">Impressum</h1>
                <p className="text-muted-foreground mb-10">Legal Disclosure (§ 5 DDG)</p>

                <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Site Operator</h2>
                        <p>
                            Monir Said<br />
                            Stationsweg 116<br />
                            41068 Mönchengladbach<br />
                            Germany
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
                        <p>
                            Email: <a href="mailto:support@gosimy.com" className="text-primary hover:underline">support@gosimy.com</a><br />
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">Responsible Person</h2>
                        <p>
                            Monir Said<br />
                            (Content responsible according to § 18 Abs. 2 MStV)
                        </p>
                    </section>



                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-3">EU Dispute Resolution</h2>
                        <p>
                            The European Commission provides a platform for online dispute resolution (ODR):{' '}
                            <a
                                href="https://ec.europa.eu/consumers/odr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                https://ec.europa.eu/consumers/odr
                            </a>
                        </p>
                        <p className="mt-2">
                            We are not willing or obligated to participate in dispute resolution proceedings
                            before a consumer arbitration board.
                        </p>
                    </section>

                </div>
            </div>
        </div>
    );
}

"""Management command to seed the database with realistic test data."""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.clients.models import Client
from apps.cases.models import Case
from apps.documents.models import Document
from apps.documents.models import DocumentStatusHistory

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with realistic test data for all pages.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete all existing data before seeding.',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write('Flushing existing data...')
            DocumentStatusHistory.objects.all().delete()
            Document.objects.all().delete()
            Case.objects.all().delete()
            Client.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            # Keep superusers, but delete the seeded admin if re-running
            User.objects.filter(email='admin@legalaid.dev').delete()

        self.stdout.write('Seeding database...\n')

        # ── Admin user ──────────────────────────────────────────────
        admin, created = User.objects.get_or_create(
            email='admin@legalaid.dev',
            defaults={
                'full_name': 'Priya Sharma',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            },
        )
        if created:
            admin.set_password('Admin@123456')
            admin.save()
            self.stdout.write(self.style.SUCCESS(
                '  ✓ Admin: admin@legalaid.dev / Admin@123456'
            ))
        else:
            self.stdout.write('  – Admin already exists, skipping.')

        # ── Advocate users (9 advocates = 10 total users with admin) ──
        advocates_data = [
            {'email': 'rahul@legalaid.dev', 'full_name': 'Rahul Mehta', 'password': 'Test@123456'},
            {'email': 'anita@legalaid.dev', 'full_name': 'Anita Desai', 'password': 'Test@123456'},
            {'email': 'vikram@legalaid.dev', 'full_name': 'Vikram Patel', 'password': 'Test@123456',
             'is_active': False},
            {'email': 'meera@legalaid.dev', 'full_name': 'Meera Iyer', 'password': 'Test@123456'},
            {'email': 'sanjay@legalaid.dev', 'full_name': 'Sanjay Reddy', 'password': 'Test@123456'},
            {'email': 'kavita@legalaid.dev', 'full_name': 'Kavita Jain', 'password': 'Test@123456'},
            {'email': 'arun@legalaid.dev', 'full_name': 'Arun Bhat', 'password': 'Test@123456'},
            {'email': 'nisha@legalaid.dev', 'full_name': 'Nisha Verma', 'password': 'Test@123456'},
            {'email': 'rohit@legalaid.dev', 'full_name': 'Rohit Kapoor', 'password': 'Test@123456'},
        ]

        advocates = []
        for adv in advocates_data:
            pw = adv.pop('password')
            is_active = adv.pop('is_active', True)
            user, created = User.objects.get_or_create(
                email=adv['email'],
                defaults={'full_name': adv['full_name'], 'role': 'advocate', 'is_active': is_active},
            )
            if created:
                user.set_password(pw)
                user.save()
                tag = ' (INACTIVE)' if not is_active else ''
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ Advocate: {user.email} / Test@123456{tag}'
                ))
            else:
                self.stdout.write(f'  – Advocate {user.email} already exists, skipping.')
            advocates.append(user)

        rahul, anita, vikram, meera, sanjay, kavita, arun, nisha, rohit = advocates

        # ── Clients (20 clients across all advocates) ────────────────
        clients_data = [
            # Rahul's clients (4)
            {'advocate': rahul, 'full_name': 'Suresh Kumar', 'email': 'suresh.kumar@example.com',
             'phone': '+91 98765 43210', 'address': '45 MG Road, Bengaluru 560001',
             'notes': 'Land dispute case. Prefers communication in Kannada.'},
            {'advocate': rahul, 'full_name': 'Lakshmi Devi', 'email': 'lakshmi.d@example.com',
             'phone': '+91 87654 32109', 'address': '12 Temple Street, Mysuru 570001',
             'notes': 'Elderly client. Needs assistance with property documents.'},
            {'advocate': rahul, 'full_name': 'Mohammed Irfan', 'email': 'irfan.m@example.com',
             'phone': '+91 99887 76655', 'address': '78 Commercial Street, Bengaluru 560025',
             'notes': 'Small business owner. Multiple pending agreements.'},
            {'advocate': rahul, 'full_name': 'Deepa Nair', 'email': 'deepa.nair@example.com',
             'phone': '+91 77665 54433', 'address': '33 Park Avenue, Kochi 682001',
             'notes': 'Referred by Suresh Kumar. Family property matter.'},
            # Anita's clients (3)
            {'advocate': anita, 'full_name': 'Rajesh Gupta', 'email': 'rajesh.gupta@example.com',
             'phone': '+91 91234 56789', 'address': '101 Civil Lines, Delhi 110054',
             'notes': 'Rental agreement dispute with landlord.'},
            {'advocate': anita, 'full_name': 'Fatima Begum', 'email': 'fatima.b@example.com',
             'phone': '+91 88776 65544', 'address': '22 Charminar Road, Hyderabad 500002',
             'notes': 'Inheritance documents. Sensitive matter — handle with care.'},
            {'advocate': anita, 'full_name': 'Arjun Singh', 'email': 'arjun.singh@example.com',
             'phone': '+91 96543 21098', 'address': '5 Sector 17, Chandigarh 160017',
             'notes': 'Corporate client. Partnership deed review.'},
            # Vikram's client (inactive advocate — data still exists)
            {'advocate': vikram, 'full_name': 'Neha Joshi', 'email': 'neha.joshi@example.com',
             'phone': '+91 70123 45678', 'address': '88 FC Road, Pune 411004',
             'notes': 'Vikram\'s client before account was deactivated.'},
            # Meera's clients (3)
            {'advocate': meera, 'full_name': 'Gopal Krishnan', 'email': 'gopal.k@example.com',
             'phone': '+91 94432 11234', 'address': '15 Anna Salai, Chennai 600002',
             'notes': 'Property registration dispute. Tamil-speaking client.'},
            {'advocate': meera, 'full_name': 'Preethi Mohan', 'email': 'preethi.m@example.com',
             'phone': '+91 98123 45567', 'address': '7 Nungambakkam High Road, Chennai 600034',
             'notes': 'Divorce settlement documents. Requires confidentiality.'},
            {'advocate': meera, 'full_name': 'Venkat Raman', 'email': 'venkat.r@example.com',
             'phone': '+91 80567 89012', 'address': '42 ECR, Pondicherry 605001',
             'notes': 'Ancestral property claim. Documents in French colonial format.'},
            # Sanjay's clients (2)
            {'advocate': sanjay, 'full_name': 'Ravi Teja', 'email': 'ravi.teja@example.com',
             'phone': '+91 90876 54321', 'address': '88 Jubilee Hills, Hyderabad 500033',
             'notes': 'Commercial property lease dispute with builder.'},
            {'advocate': sanjay, 'full_name': 'Padma Lakshmi', 'email': 'padma.l@example.com',
             'phone': '+91 81234 56789', 'address': '23 Banjara Hills, Hyderabad 500034',
             'notes': 'Agricultural land conversion case.'},
            # Kavita's clients (2)
            {'advocate': kavita, 'full_name': 'Amit Saxena', 'email': 'amit.saxena@example.com',
             'phone': '+91 95678 12345', 'address': '56 Vaishali Nagar, Jaipur 302021',
             'notes': 'Business partnership dissolution. Multiple documents pending.'},
            {'advocate': kavita, 'full_name': 'Sunita Devi', 'email': 'sunita.d@example.com',
             'phone': '+91 78901 23456', 'address': '12 MI Road, Jaipur 302001',
             'notes': 'Widow pension documents. Government handwritten records.'},
            # Arun's clients (2)
            {'advocate': arun, 'full_name': 'Ganesh Hegde', 'email': 'ganesh.h@example.com',
             'phone': '+91 96789 01234', 'address': '34 KG Road, Bengaluru 560009',
             'notes': 'Employment contract dispute. Bilingual documents (Kannada/English).'},
            {'advocate': arun, 'full_name': 'Savitha Rao', 'email': 'savitha.r@example.com',
             'phone': '+91 88901 23456', 'address': '67 Jayanagar, Bengaluru 560041',
             'notes': 'Property inheritance. Multiple siblings involved.'},
            # Nisha's clients (2)
            {'advocate': nisha, 'full_name': 'Ramesh Pandey', 'email': 'ramesh.p@example.com',
             'phone': '+91 91234 98765', 'address': '89 Gomti Nagar, Lucknow 226010',
             'notes': 'Tenant eviction case. Old handwritten rental agreement.'},
            {'advocate': nisha, 'full_name': 'Ayesha Khan', 'email': 'ayesha.k@example.com',
             'phone': '+91 70987 65432', 'address': '14 Hazratganj, Lucknow 226001',
             'notes': 'Family court documents. Urdu and Hindi mixed records.'},
            # Rohit's clients (2)
            {'advocate': rohit, 'full_name': 'Devendra Mishra', 'email': 'devendra.m@example.com',
             'phone': '+91 85432 10987', 'address': '45 Arera Colony, Bhopal 462016',
             'notes': 'Mining lease agreement. Government-stamped documents.'},
            {'advocate': rohit, 'full_name': 'Pallavi Shukla', 'email': 'pallavi.s@example.com',
             'phone': '+91 93210 87654', 'address': '22 New Market, Bhopal 462003',
             'notes': 'Shop ownership transfer. Damaged deed requires OCR.'},
        ]

        clients = []
        for c in clients_data:
            client, created = Client.objects.get_or_create(
                advocate=c['advocate'],
                email=c['email'],
                defaults={k: v for k, v in c.items() if k not in ('advocate', 'email')},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Client: {client.full_name}'))
            clients.append(client)

        (suresh, lakshmi, irfan, deepa, rajesh, fatima, arjun, neha,
         gopal, preethi, venkat, ravi_t, padma, amit, sunita,
         ganesh, savitha, ramesh, ayesha, devendra, pallavi) = clients

        # ── Cases ───────────────────────────────────────────────────
        cases_data = [
            # Rahul's cases
            {'advocate': rahul, 'client': suresh, 'title': 'Land Title Verification',
             'case_number': 'LTV-2025-001', 'status': 'active',
             'description': 'Verify and authenticate land title documents for 2-acre plot in Whitefield. Client claims ownership since 1998.'},
            {'advocate': rahul, 'client': suresh, 'title': 'Boundary Dispute Resolution',
             'case_number': 'BDR-2025-002', 'status': 'active',
             'description': 'Resolve boundary dispute with neighboring property. Survey documents are damaged and need processing.'},
            {'advocate': rahul, 'client': lakshmi, 'title': 'Property Transfer Deed',
             'case_number': 'PTD-2025-003', 'status': 'active',
             'description': 'Process property transfer deed from late husband. Original documents are handwritten and partially damaged.'},
            {'advocate': rahul, 'client': irfan, 'title': 'Shop Lease Agreement',
             'case_number': 'SLA-2025-004', 'status': 'active',
             'description': 'Draft and verify shop lease agreement for new commercial space on Brigade Road.'},
            {'advocate': rahul, 'client': irfan, 'title': 'Partnership Dissolution',
             'case_number': 'PD-2025-005', 'status': 'closed',
             'description': 'Partnership dissolution completed. All documents processed and filed.'},
            {'advocate': rahul, 'client': deepa, 'title': 'Family Property Partition',
             'case_number': 'FPP-2025-006', 'status': 'pending',
             'description': 'Partition of ancestral property among 4 siblings. Awaiting original documents from client.'},
            # Anita's cases
            {'advocate': anita, 'client': rajesh, 'title': 'Tenant Eviction Notice',
             'case_number': 'TEN-2025-007', 'status': 'active',
             'description': 'Prepare eviction notice for non-paying tenant. Rental agreement copy is stamped but faded.'},
            {'advocate': anita, 'client': fatima, 'title': 'Will Authentication',
             'case_number': 'WA-2025-008', 'status': 'active',
             'description': 'Authenticate handwritten will of late father. Document is in Urdu with some water damage.'},
            {'advocate': anita, 'client': arjun, 'title': 'Partnership Deed Review',
             'case_number': 'PDR-2025-009', 'status': 'pending',
             'description': 'Review partnership deed for new tech startup. Multiple versions need comparison.'},
        ]

        cases = []
        for c in cases_data:
            case, created = Case.objects.get_or_create(
                advocate=c['advocate'],
                case_number=c['case_number'],
                defaults={k: v for k, v in c.items() if k not in ('advocate', 'case_number')},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Case: {case.case_number} — {case.title}'))
            cases.append(case)

        (land_title, boundary, prop_transfer, shop_lease, partnership_closed,
         family_partition, eviction, will_auth, partnership_review) = cases

        # ── Documents ───────────────────────────────────────────────
        docs_data = [
            # Land Title Verification — fully processed
            {'case': land_title, 'advocate': rahul, 'name': 'Original Land Title (1998)',
             'file_path': 'documents/rahul/suresh/land_title_1998.pdf',
             'file_type': 'pdf', 'file_size_bytes': 2_450_000, 'mime_type': 'application/pdf',
             'status': 'processed', 'notes': 'Scanned copy of original title deed.'},
            {'case': land_title, 'advocate': rahul, 'name': 'Survey Map — Whitefield Plot',
             'file_path': 'documents/rahul/suresh/survey_map.jpg',
             'file_type': 'image', 'file_size_bytes': 8_100_000, 'mime_type': 'image/jpeg',
             'status': 'processed', 'notes': 'High-res scan of survey map.'},
            # Boundary Dispute — in progress
            {'case': boundary, 'advocate': rahul, 'name': 'Damaged Survey Document',
             'file_path': 'documents/rahul/suresh/damaged_survey.jpg',
             'file_type': 'image', 'file_size_bytes': 5_200_000, 'mime_type': 'image/jpeg',
             'status': 'in_progress', 'notes': 'Water-damaged survey document. Needs OCR processing.'},
            {'case': boundary, 'advocate': rahul, 'name': 'Neighbor Agreement (Draft)',
             'file_path': 'documents/rahul/suresh/neighbor_agreement.pdf',
             'file_type': 'pdf', 'file_size_bytes': 340_000, 'mime_type': 'application/pdf',
             'status': 'ready_to_process', 'notes': 'Handwritten agreement between neighbors.'},
            # Property Transfer Deed — ready to process
            {'case': prop_transfer, 'advocate': rahul, 'name': 'Handwritten Transfer Deed',
             'file_path': 'documents/rahul/lakshmi/transfer_deed.jpg',
             'file_type': 'image', 'file_size_bytes': 6_700_000, 'mime_type': 'image/jpeg',
             'status': 'ready_to_process', 'notes': 'Handwritten deed by late husband. Partially faded.'},
            {'case': prop_transfer, 'advocate': rahul, 'name': 'Death Certificate',
             'file_path': 'documents/rahul/lakshmi/death_certificate.pdf',
             'file_type': 'pdf', 'file_size_bytes': 190_000, 'mime_type': 'application/pdf',
             'status': 'uploaded', 'notes': 'Supporting document.'},
            # Shop Lease — uploaded
            {'case': shop_lease, 'advocate': rahul, 'name': 'Lease Agreement Draft v1',
             'file_path': 'documents/rahul/irfan/lease_v1.pdf',
             'file_type': 'pdf', 'file_size_bytes': 420_000, 'mime_type': 'application/pdf',
             'status': 'uploaded', 'notes': 'First draft of lease agreement.'},
            {'case': shop_lease, 'advocate': rahul, 'name': 'Shop Photos',
             'file_path': 'documents/rahul/irfan/shop_photos.jpg',
             'file_type': 'image', 'file_size_bytes': 12_300_000, 'mime_type': 'image/jpeg',
             'status': 'uploaded', 'notes': 'Photos of the commercial space.'},
            # Partnership (closed case) — processed
            {'case': partnership_closed, 'advocate': rahul, 'name': 'Partnership Deed',
             'file_path': 'documents/rahul/irfan/partnership_deed.pdf',
             'file_type': 'pdf', 'file_size_bytes': 890_000, 'mime_type': 'application/pdf',
             'status': 'processed',
             'notes': 'Original partnership deed. Processing complete.'},
            # Eviction — mixed statuses
            {'case': eviction, 'advocate': anita, 'name': 'Rental Agreement (Faded)',
             'file_path': 'documents/anita/rajesh/rental_agreement.jpg',
             'file_type': 'image', 'file_size_bytes': 4_500_000, 'mime_type': 'image/jpeg',
             'status': 'in_progress', 'notes': 'Stamped rental agreement. Ink is faded — needs enhancement.'},
            {'case': eviction, 'advocate': anita, 'name': 'Payment Default Proof',
             'file_path': 'documents/anita/rajesh/payment_proof.pdf',
             'file_type': 'pdf', 'file_size_bytes': 280_000, 'mime_type': 'application/pdf',
             'status': 'ready_to_process', 'notes': 'Bank statements showing missed payments.'},
            # Will Authentication — ready
            {'case': will_auth, 'advocate': anita, 'name': 'Handwritten Will (Urdu)',
             'file_path': 'documents/anita/fatima/will_urdu.jpg',
             'file_type': 'image', 'file_size_bytes': 7_800_000, 'mime_type': 'image/jpeg',
             'status': 'ready_to_process', 'notes': 'Handwritten will in Urdu. Has water stains on edges.'},
            {'case': will_auth, 'advocate': anita, 'name': 'Property Registry Extract',
             'file_path': 'documents/anita/fatima/registry_extract.pdf',
             'file_type': 'pdf', 'file_size_bytes': 560_000, 'mime_type': 'application/pdf',
             'status': 'uploaded', 'notes': 'Registry office extract for cross-reference.'},
        ]

        status_flow = {
            'uploaded': ['uploaded'],
            'ready_to_process': ['uploaded', 'ready_to_process'],
            'in_progress': ['uploaded', 'ready_to_process', 'in_progress'],
            'processed': ['uploaded', 'ready_to_process', 'in_progress', 'processed'],
        }

        for d in docs_data:
            final_status = d['status']
            d_copy = {**d, 'status': 'uploaded'}
            doc, created = Document.objects.get_or_create(
                case=d_copy['case'],
                name=d_copy['name'],
                defaults={k: v for k, v in d_copy.items() if k not in ('case', 'name')},
            )
            if created:
                # Build status history
                transitions = status_flow[final_status]
                prev = None
                for s in transitions:
                    DocumentStatusHistory.objects.create(
                        document=doc,
                        from_status=prev,
                        to_status=s,
                        changed_by=d['advocate'],
                    )
                    prev = s
                doc.status = final_status
                doc.save(update_fields=['status'])
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ Doc: {doc.name} [{final_status}]'
                ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 50))
        self.stdout.write(self.style.SUCCESS('  Seed complete!'))
        self.stdout.write(self.style.SUCCESS('═' * 50))
        self.stdout.write('')
        self.stdout.write('  Login credentials:')
        self.stdout.write(self.style.WARNING('  ┌───────────────────────────────────────────────────┐'))
        self.stdout.write(self.style.WARNING('  │ ADMIN                                             │'))
        self.stdout.write(self.style.WARNING('  │   admin@legalaid.dev  / Admin@123456              │'))
        self.stdout.write(self.style.WARNING('  │                                                   │'))
        self.stdout.write(self.style.WARNING('  │ ADVOCATES (all use Test@123456)                   │'))
        self.stdout.write(self.style.WARNING('  │   rahul@legalaid.dev   meera@legalaid.dev         │'))
        self.stdout.write(self.style.WARNING('  │   anita@legalaid.dev   sanjay@legalaid.dev        │'))
        self.stdout.write(self.style.WARNING('  │   kavita@legalaid.dev  arun@legalaid.dev          │'))
        self.stdout.write(self.style.WARNING('  │   nisha@legalaid.dev   rohit@legalaid.dev         │'))
        self.stdout.write(self.style.WARNING('  │   vikram@legalaid.dev  (INACTIVE)                 │'))
        self.stdout.write(self.style.WARNING('  └───────────────────────────────────────────────────┘'))
        self.stdout.write('')
        self.stdout.write(f'  Clients: {Client.objects.count()}')
        self.stdout.write(f'  Cases:   {Case.objects.count()}')
        self.stdout.write(f'  Docs:    {Document.objects.count()}')
        self.stdout.write(f'  History: {DocumentStatusHistory.objects.count()} entries')
        self.stdout.write('')

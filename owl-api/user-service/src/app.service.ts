import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly BASE_ID = 'appumOs6hlFGhbv7c';
  private readonly TABLE_NAME = 'tbldJ8CL1xt7qcnrM';
  private readonly EMAIL_TABLE_ID = 'tblFDNhax22eAjSB3';
  private readonly AIRTABLE_API_KEY = process.env.USER_SERVICE_AIRTABLE_API_KEY;

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async createInitialRsvp(email: string, clientIP: string): Promise<void> {
    if (!this.AIRTABLE_API_KEY) {
      throw new HttpException(
        'Server configuration error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!email || !email.trim()) {
      throw new HttpException(
        'Email is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!this.isValidEmail(email)) {
      throw new HttpException(
        'Please enter a valid email address',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log('Adding email to Email table:', email);
      const response = await fetch(
        `https://api.airtable.com/v0/${this.BASE_ID}/${this.EMAIL_TABLE_ID}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  Email: email,
                },
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable API error:', errorData);
        throw new HttpException(
          'Failed to save email',
          response.status || HttpStatus.BAD_REQUEST,
        );
      }

      const data = await response.json();
      console.log('Successfully added email to Email table:', data.records[0].id);
    } catch (error) {
      console.error('Error saving email:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private calculateAge(birthday: string): number {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async completeRsvp(
    data: { email: string; firstName: string; lastName: string; birthday: string },
    clientIP: string,
  ): Promise<void> {
    if (!this.AIRTABLE_API_KEY) {
      throw new HttpException(
        'Server configuration error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      throw new HttpException(
        'Valid email is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const age = this.calculateAge(data.birthday);
    if (isNaN(age) || age < 0) {
      throw new HttpException(
        'Invalid birthday format',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (age >= 19) {
      throw new HttpException(
        'Midnight is for teenagers 18 and under. You must be 18 or younger to attend.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      console.log('Checking for existing RSVP with email:', data.email);
      const filterFormula = `{fldZCDn3M5M2F6AOX}="${data.email}"`;
      const searchUrl = `https://api.airtable.com/v0/${this.BASE_ID}/${this.TABLE_NAME}?filterByFormula=${encodeURIComponent(filterFormula)}`;
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.AIRTABLE_API_KEY}`,
        },
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        console.error('Airtable search error:', errorData);
        throw new HttpException(
          'Failed to check existing RSVPs',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const searchData = await searchResponse.json();
      
      if (searchData.records && searchData.records.length > 0) {
        const existingRecord = searchData.records[0];
        const fields = existingRecord.fields;
        
        const hasFirstName = fields['First Name'] && fields['First Name'].trim() !== '';
        const hasLastName = fields['Last Name'] && fields['Last Name'].trim() !== '';
        const hasBirthday = fields['Birthday'] && fields['Birthday'].trim() !== '';
        
        if (hasFirstName && hasLastName && hasBirthday) {
          throw new HttpException(
            'Sorry you can\'t rsvp at this time.',
            HttpStatus.BAD_REQUEST,
          );
        }
        
        console.log('Updating incomplete RSVP record:', existingRecord.id);
        const updateResponse = await fetch(
          `https://api.airtable.com/v0/${this.BASE_ID}/${this.TABLE_NAME}/${existingRecord.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${this.AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                fldLfzvf3xvXnLeIr: data.firstName,
                fldfOBSrsWih4oHe6: data.lastName,
                fldsYVJC0EpDMiSgY: data.birthday,
                fldRmDEgOgxdjLcpR: clientIP,
              },
            }),
          },
        );

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          console.error('Airtable update error:', errorData);
          throw new HttpException(
            'Failed to update RSVP',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        console.log('Successfully updated RSVP:', existingRecord.id);
        
        try {
          const mailServiceUrl = process.env.MAIL_SERVICE_URL || 'http://localhost:3003';
          const mailResponse = await fetch(`${mailServiceUrl}/send-rsvp-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: data.email }),
          });

          if (!mailResponse.ok) {
            console.error('Failed to send email, but RSVP was updated successfully');
          } else {
            console.log('Successfully sent RSVP confirmation email');
          }
        } catch (emailError) {
          console.error('Error sending email, but RSVP was updated successfully:', emailError);
        }

        return;
      }

      console.log('Creating new RSVP for:', data.email);
      const createResponse = await fetch(
        `https://api.airtable.com/v0/${this.BASE_ID}/${this.TABLE_NAME}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            records: [
              {
                fields: {
                  fldZCDn3M5M2F6AOX: data.email,
                  fldLfzvf3xvXnLeIr: data.firstName,
                  fldfOBSrsWih4oHe6: data.lastName,
                  fldsYVJC0EpDMiSgY: data.birthday,
                  fldRmDEgOgxdjLcpR: clientIP,
                },
              },
            ],
          }),
        },
      );

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('Airtable API error:', errorData);
        throw new HttpException(
          'Failed to create RSVP',
          createResponse.status || HttpStatus.BAD_REQUEST,
        );
      }

      const createData = await createResponse.json();
      const recordId = createData.records[0].id;
      console.log('Successfully created RSVP:', recordId);
      
      try {
        const mailServiceUrl = process.env.MAIL_SERVICE_URL || 'http://localhost:3003';
        const mailResponse = await fetch(`${mailServiceUrl}/send-rsvp-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: data.email }),
        });

        if (!mailResponse.ok) {
          console.error('Failed to send email, but RSVP was created successfully');
        } else {
          console.log('Successfully sent RSVP confirmation email');
        }
        } catch (emailError) {
          console.error('Error sending email, but RSVP was created successfully:', emailError);
        }
      } catch (error) {
        console.error('Error completing RSVP:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getHealth() {
    return { status: 'ok', service: 'user-service' };
  }
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Evaluation } from '@/types/evaluation';

interface EditBookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Evaluation;
  onSuccess: () => void;
}

export function EditBookDialog({ open, onOpenChange, book, onSuccess }: EditBookDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(book.result?.title || '');
  const [author, setAuthor] = useState(book.result?.author || '');
  const [publisher, setPublisher] = useState(book.result?.publisher || '');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(book.coverImage || null);

  // Sync form state with book prop when it changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(book.result?.title || '');
      setAuthor(book.result?.author || '');
      setPublisher(book.result?.publisher || '');
      setCoverImageFile(null);
      setCoverImagePreview(book.coverImage || null);
    }
  }, [open, book]);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (title.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Title cannot be empty',
      });
      return;
    }
    
    if (author.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Author cannot be empty',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Only send fields that have non-empty values and have changed
      if (title !== book.result?.title && title.trim()) formData.append('title', title.trim());
      if (author !== book.result?.author && author.trim()) formData.append('author', author.trim());
      if (publisher !== book.result?.publisher && publisher.trim()) formData.append('publisher', publisher.trim());
      if (coverImageFile) formData.append('coverImage', coverImageFile);

      const response = await fetch(`/api/evaluations/${book.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update book' }));
        throw new Error(errorData.details || errorData.error || 'Failed to update book');
      }

      toast({
        title: 'Success',
        description: 'Book information updated successfully!',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update book',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Book Information</DialogTitle>
          <DialogDescription>
            Update the book details and upload a cover image
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image Preview & Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-32 bg-gradient-to-br from-orange-200 via-yellow-100 to-orange-100 rounded-lg overflow-hidden flex-shrink-0">
                {coverImagePreview ? (
                  <img 
                    src={coverImagePreview} 
                    alt="Book cover preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-orange-400/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                  data-testid="input-cover-image"
                />
                <Label 
                  htmlFor="cover-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, JPEG up to 10MB
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter book title"
              data-testid="input-edit-title"
            />
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              data-testid="input-edit-author"
            />
          </div>

          {/* Publisher */}
          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Enter publisher name"
              data-testid="input-edit-publisher"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-save-edit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
